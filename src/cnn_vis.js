import * as d3 from "d3";
import * as config from "./config";
import * as d3_slider from "d3-simple-slider"
import * as d3_drag from "d3-drag"
import {create_max_pool_2d, createConv} from "./convIntro/tensor"
import * as tf from "@tensorflow/tfjs";

function load_img_channels(url, callback) {
    const canvas = document.getElementById('input-image');
    const context = canvas.getContext('2d');

    const base_image = new Image();
    base_image.onload = () => {
        canvas.width = base_image.width;
        canvas.height = base_image.height;

        let img = [...Array(3)].map(() => [...Array(canvas.height)].map(() => [...Array(canvas.width)].map(() => 0)));
        context.drawImage(base_image, 0, 0);

        const imgData = context.getImageData(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < imgData.data.length; i += 4) {
            let x = (i / 4) % canvas.width;
            let y = Math.floor((i / 4) / canvas.width);

            for(let j = 0; j < 3; ++j) {
                img[j][y][x] = imgData.data[i + j]
            }            

        }

        callback(img)
    }

    base_image.crossOrigin = "Anonymous";
    base_image.src = url;
}


export function init_cnn_vis() {
    let width = 2 * config.img_width + config.spaceBetween + config.borderWidth
    let height = config.img_height + config.borderWidth
    
    d3.select("#userTrainSection")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("id", "cnn-vis-main")
    .append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", `translate(${0}, ${height/2})`)
    .attr("id", "cnn-vis")

    load_img_channels("https://raw.githubusercontent.com/UW-CSE442-WI20/A3-convolutional-neural-networks/michan4-v2/Images/dog.png", img => 
    draw_cnn_vis(img))
}

function flatten(a) {
    return a.reduce((acc, val) => acc.concat(val), []);
}

function random_matrix(w, h) {
    return [...Array(h)].map(() => [...Array(w)].map(() => Math.floor(Math.random() * 256)));
}

class Layer {
    constructor(x, y, w, h, size, filters, filter_gap, kernel_size, no_overlap=false, rad=Math.PI/4) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.size = size
        this.filters = filters
        this.filter_gap = filter_gap
        this.kernel_size = kernel_size
        this.no_overlap = no_overlap

        this.layer_index = null
        this.prev_layer = null
        this.next_layer = null

        this.original_data = null
        this.data = null

        // Only allow this mode if kernel divides image size
        console.assert(!no_overlap || size / kernel_size - Math.floor(size / kernel_size) == 0)

        this.rad = rad
    }

    static link_network(network) {
        for(let i = 0; i < network.length; ++i) {
            network[i].layer_index = i
            network[i].prev_layer = i > 0 ? network[i - 1] : null;
            network[i].next_layer = i < network.length - 1 ? network[i + 1] : null;
        }
    }

    get_total_height() {
        let y_scale = Math.sin(this.rad)
        return this.h + y_scale * this.w
    }

    get_total_width() {
        let x_scale = Math.cos(this.rad)
        return (this.filters - 1) * this.filter_gap + x_scale * this.w
    }

    get_3d_rect_verical_vertices(x, y, w, h, rad, x_index = 0, y_index = 0) {
        let x_scale = Math.cos(rad)
        let y_scale = Math.sin(rad)

        x += x_index * x_scale * w
        y -= y_index * h + x_index * y_scale * h

        return [[x, y], [x + x_scale * w, y - y_scale * w], [x + x_scale * w, y - h - y_scale * w], [x, y - h]]
    }

    points_to_str(points) {
        return `${points[0][0]}, ${points[0][1]} ${points[1][0]}, ${points[1][1]} ${points[2][0]}, ${points[2][1]} ${points[3][0]}, ${points[3][1]}`
    }

    draw_quadrilateral(polygon, points, color, opacity, stroke_color, stroke_width) {
        return polygon
            .attr("points", this.points_to_str(points))
            .attr("fill-opacity", opacity)
            .attr("fill", color)
            .attr("stroke", stroke_color)
            .attr("stroke-width", stroke_width)
            .style("cursor", "pointer")
            .on("mouseover", function() { d3.select(this).attr("fill", "yellow") })
            .on("mouseout", function() { d3.select(this).attr("fill", color) });
    }

    draw_3d_rect_vertical(polygon, x, y, w, h, rad, x_index, y_index, color, opacity, stroke_color, stroke_width) {
        let points = this.get_3d_rect_verical_vertices(x, y, w, h, rad, x_index, y_index)
        return this.draw_quadrilateral(polygon, points, color, opacity, stroke_color, stroke_width)
    }

    calc_offset(sign, kernel_size, cell_size) {
        return (1 + sign) * cell_size / 2 + sign * (kernel_size - 1) / 2 * cell_size
    }

    calc_cell_dims() {
        return [this.w / this.size, this.h / this.size]
    }

    calc_col_row(index) {
        return [index % this.size, this.size - 1 - Math.floor(index / this.size)]
    }

    calc_cell_x_loc(col, filter_index) {
        let x_scale = Math.cos(this.rad)
        let cell_width = this.calc_cell_dims()[0]
        return this.x + col * x_scale * cell_width + this.filter_gap * filter_index
    }

    calc_cell_y_loc(col, row) {
        let y_scale = Math.sin(this.rad);
        let cell_height = this.calc_cell_dims()[1]
        return this.y - row * cell_height - col * y_scale * cell_height
    }

    draw_layer_connection(svg, cell_in_index, cell_out_index, selected_filter_idx) {
        let return_index = -1

        // We are going backward and need to determine the index which
        // generates cell_out_index
        if (cell_in_index < 0) {
            // This is unambiguous
            if (!this.no_overlap) {
                cell_in_index = cell_out_index
            }
            // In this case there are this.kernel possible return paths
            // Resolve ambiguity manually by finding the original max
            else {
                let [col_out, row_out] = this.next_layer.calc_col_row(cell_out_index)

                let kernel_col = col_out * this.kernel_size
                let kernel_row = this.size - this.kernel_size - row_out * this.kernel_size

                let o_x = 0
                let o_y = 0
                let m = -Infinity
                for (let i = 0; i < this.kernel_size; ++i) {
                    for (let j = 0; j < this.kernel_size; ++j) {
                        let val = this.data[Math.min(selected_filter_idx, this.data.length - 1)][kernel_row+i][kernel_col+j]

                        if (val > m) {
                            m = val
                            o_x = j
                            o_y = i
                        }
                    }
                }
                
                cell_in_index = (kernel_row + o_y) * this.size + kernel_col + o_x
            }

            return_index = cell_in_index
        }


        let [col, row] = this.calc_col_row(cell_in_index)
        let [cell_width, cell_height] = this.calc_cell_dims()
        
        let c = Math.floor((this.kernel_size-1)/2)

        let kernel_col = col - c
        let kernel_row = row - c

        let col_out = col
        let row_out = row

        if (this.no_overlap) {
            kernel_col = Math.floor(col / this.kernel_size) * this.kernel_size
            kernel_row = Math.floor(row / this.kernel_size) * this.kernel_size

            col_out = kernel_col / this.kernel_size
            row_out = kernel_row / this.kernel_size
        }

        let color_1 = this.layer_index % 2 == 0 ? "#39FF14" : "red"
        let color_2 = this.layer_index % 2 == 1 ? "#39FF14" : "red"

        for (let filter_idx = 0; filter_idx < this.filters; ++filter_idx) {
            let kernel_x = this.calc_cell_x_loc(kernel_col, filter_idx)
            let kernel_y = this.calc_cell_y_loc(kernel_col, kernel_row)

            // Draw filter rectangle
            this.draw_3d_rect_vertical(svg.insert("polygon", "#outline-" + this.layer_index + "-" + (filter_idx + 1)),
                                        kernel_x,
                                        kernel_y,
                                        cell_width * this.kernel_size,
                                        cell_height * this.kernel_size,
                                        this.rad, 0, 0, null, 0, color_2, 1)
                                        .attr("pointer-events", "none")
                                        .attr("id", "kernel-" + this.layer_index + "-" + filter_idx)

            let x_cell = this.calc_cell_x_loc(col, filter_idx)
            let y_cell = this.calc_cell_y_loc(col, row)
            
            // Draw the output of the convolution from the previous layer
            // This is always just a pixel of size 1
            this.draw_3d_rect_vertical(svg.insert("polygon", "#outline-" + this.layer_index + "-" + (filter_idx + 1)),
            x_cell, y_cell, cell_width * 1, cell_height * 1, this.rad, 0, 0,
                                    null, 0, color_1, 1).attr("pointer-events", "none").attr("id", "out-" + this.layer_index + "-" + filter_idx)

        

            // Draw connection lines between the kernels in same layer
            if (filter_idx == this.filters - 1) {
                break
            }

            for (let i = 0; i < 4; ++i) {
                // Trick to do all of this in one loop. Generates -1 -1; -1, 1; 1, -1; 1, 1.
                // These are used to calculate the offsets to the corners from the center of the cell
                let o_x = i & 1
                let o_y = (i >> 1) & 1
            
                x_cell = this.calc_cell_x_loc(kernel_col + o_x * this.kernel_size, filter_idx)
                let x_cell_next = this.calc_cell_x_loc(kernel_col + o_x * this.kernel_size, filter_idx + 1)
                y_cell = this.calc_cell_y_loc(kernel_col + o_x * this.kernel_size, kernel_row + o_y * this.kernel_size)

                // Connect kernel
                svg.select("#connection-line-kernel-" + this.layer_index + "-" + filter_idx + "-" + i).remove()
                svg.insert("line", "#outline-" + this.layer_index + "-" + (filter_idx + 1))
                    .attr("x1", x_cell)
                    .attr("y1", y_cell)
                    .attr("x2", x_cell_next)
                    .attr("y2", y_cell)
                    .attr("pointer-events", "none")
                    .attr("stroke-dasharray", 2)
                    .attr("stroke-dashoffset", 2)
                    .attr("stroke", color_2)
                    .attr("stroke-width", 2)
                    .attr("id", "connection-line-kernel-" + this.layer_index + "-" + filter_idx + "-" + i)

                x_cell = this.calc_cell_x_loc(col + o_x, filter_idx)
                x_cell_next = this.calc_cell_x_loc(col + o_x, filter_idx + 1)
                y_cell = this.calc_cell_y_loc(col + o_x, row + o_y)

                // Connect output of previous convolution
                svg.select("#connection-line-" + this.layer_index + "-" + filter_idx + "-" + i).remove()
                svg.insert("line", "#outline-" + this.layer_index + "-" + (filter_idx + 1))
                    .attr("x1", x_cell)
                    .attr("y1", y_cell)
                    .attr("x2", x_cell_next)
                    .attr("y2", y_cell)
                    .attr("pointer-events", "none")
                    .attr("stroke-dasharray", 2)
                    .attr("stroke", color_1)
                    .attr("stroke-width", 2)
                    .attr("id", "connection-line-" + this.layer_index + "-" + filter_idx + "-" + i)
            }
        }

        // Draw connection lines to next layer, first filter, shotout to A3  
        let filter_idx = this.filters - 1
        
        if (this.next_layer == null)
            return -1

        for (let i = 0; i < 4; ++i) {
            // Trick to do all of this in one loop. Generates -1 -1; -1, 1; 1, -1; 1, 1.
            // These are used to calculate the offsets to the corners from the center of the cell
            let o_x = i & 1
            let o_y = (i >> 1) & 1

            let kernel_x = this.calc_cell_x_loc(kernel_col + o_x * this.kernel_size, filter_idx)
            let kernel_y = this.calc_cell_y_loc(kernel_col + o_x * this.kernel_size, kernel_row + o_y * this.kernel_size)

            let out_x = this.next_layer.calc_cell_x_loc(col_out + o_x, 0)
            let out_y = this.next_layer.calc_cell_y_loc(col_out + o_x, row_out + o_y)

            // Connect input with output
            svg.select("#connection-line-" + this.layer_index + "-" + filter_idx + "-" + i).remove()
            svg.insert("line", "#outline-" + (this.layer_index + 1) + "-0")
                .attr("x1", kernel_x)
                .attr("y1", kernel_y)
                .attr("x2", out_x)
                .attr("y2", out_y)
                .attr("pointer-events", "none")
                .attr("stroke-dasharray", 2)
                .attr("stroke", color_2)
                .attr("stroke-width", 2)
                .attr("id", "connection-line-" + this.layer_index + "-" + filter_idx + "-" + i)
        }

        let out_index = (this.next_layer.size - 1 - row_out) * this.next_layer.size + col_out
        console.assert(cell_out_index < 0 || out_index == cell_out_index)
        return return_index < 0 ? out_index : return_index
    }

    remove_layer_connection(svg) {
        for (let filter_idx = 0; filter_idx < this.filters; ++filter_idx) {
            svg.select("#kernel-" + this.layer_index + "-" + filter_idx).remove()
            svg.select("#out-" + this.layer_index + "-" + filter_idx).remove()

            for (let i = 0; i < 4; ++i) {
                svg.select("#connection-line-" + this.layer_index + "-" + filter_idx + "-" + i).remove()
                svg.select("#connection-line-kernel-" + this.layer_index + "-" + filter_idx + "-" + i).remove()
            }
        }
    }

    static d_to_gray(d, _) {
        return d3.rgb(d, d, d)
    }

    static d_to_rgb(d, idx) {
        let color = [d / 2, d / 2, d / 2]
        color[idx % 3] *= 2
        return d3.rgb(color[0], color[1], color[2])
    }

    redraw(svg, data, color_fn=Layer.d_to_gray) {
        let original_data = this.original_data
        this.draw(svg, data, color_fn)
        this.original_data = original_data
    }

    draw(svg, data, color_fn=Layer.d_to_gray) {
        let [cell_width, cell_height] = this.calc_cell_dims()
        
        let layer = this
        this.original_data = this.data = data
        for(let filter_idx = 0; filter_idx < this.filters; ++filter_idx) {
            // Remove previously drawn layer
            svg.selectAll(".layer-" + this.layer_index + "-" + filter_idx).remove();

            // Draw outline
            this.draw_3d_rect_vertical(svg.append("polygon"), this.x + this.filter_gap * filter_idx, this.y, this.w, this.h, this.rad, 0, 0, null, 0, "purple", 4)
                .attr("id", "outline-" + this.layer_index + "-" + filter_idx)
            
            let d = data == null ? random_matrix(this.size, this.size) : data[filter_idx]

            svg.selectAll(".layer-" + this.layer_index + "-" + filter_idx)
                .data(flatten(d))
                .enter()
                .append("polygon")
                .attr("points", function(_, i) {
                    let col = i % layer.size
                    let row = layer.size - 1 - Math.floor(i / layer.size)
                    let points = layer.get_3d_rect_verical_vertices(layer.x + layer.filter_gap * filter_idx, layer.y, cell_width, cell_height, layer.rad, col, row)
                    return layer.points_to_str(points)
                })
                .attr("fill-opacity", 1)
                .attr("fill", d => color_fn(d, filter_idx))
                .style("cursor", "pointer")
                .on("mouseover", function(d, i) {
                    d3.select(this).attr("fill", "yellow")

                    // Forward
                    let idx = i
                    let cur = layer
                    while (cur != null) {
                        idx = cur.draw_layer_connection(svg, idx, -1, filter_idx)
                        cur = cur.next_layer
                    }

                    // Backward
                    idx = i
                    cur = layer.prev_layer
                    while (cur != null) {
                        idx = cur.draw_layer_connection(svg, -1, idx, filter_idx)
                        cur = cur.prev_layer
                    }
                })
                .on("mouseout", function(d) {
                    d3.select(this).attr("fill", color_fn(d, filter_idx))
                    
                    // Foward
                    let cur = layer
                    while (cur != null) {
                        cur.remove_layer_connection(svg)
                        cur = cur.next_layer
                    }

                    // Backward
                    cur = layer.prev_layer
                    while (cur != null) {
                        cur.remove_layer_connection(svg)
                        cur = cur.prev_layer
                    }
                })
                .classed("layer-" + layer.layer_index + "-" + filter_idx, true)
                .exit();
        }
    }
}


function make_centered_layer(x, w, h, size, filters, filter_gap, kernel_size, no_overlap=false, rad=Math.PI/4) {
    return new Layer(x, h/2 * (1 + Math.SQRT1_2), w, h, size, filters, filter_gap, kernel_size, no_overlap, rad)
}


function draw_cnn_vis(img) {
    let svg = d3.select("#cnn-vis")

    let network = []

    let size = 256
    let filter_gap = (size - 64) / 8
    let x_start = filter_gap

    network.push(make_centered_layer(x_start, size, size, 32, 3, filter_gap, 2, true))
    network.push(make_centered_layer(network[0].x + network[0].get_total_width() + filter_gap * 4, size / 2, size / 2, 16, 3, filter_gap, 3))
    network.push(make_centered_layer(network[1].x + network[1].get_total_width() + filter_gap * 4, size / 2, size / 2, 16, 8, filter_gap, 4, true))
    network.push(make_centered_layer(network[2].x + network[2].get_total_width() + filter_gap * 4, size / 4, size / 4, 4, 8, filter_gap, 4, true))
    network.push(make_centered_layer(network[3].x + network[3].get_total_width() + filter_gap * 4, size / 8, size / 8, 1, 10, size / 8 + 2, 1, true, Math.PI / 6))

    // Make svg/g container large enough to fit network
    let w = network[network.length - 1].x + network[network.length - 1].get_total_width() + filter_gap
    let h = network[0].get_total_height() + 2 * filter_gap

    d3.select("#cnn-vis-main").attr("width", w).attr("height", h)
    svg.attr("width", w).attr("height", h).attr("transform", `translate(${0}, ${h/2})`)

    Layer.link_network(network)

    network[0].draw(svg, img, Layer.d_to_rgb)

    let pool_2d = create_max_pool_2d(2)
    let pooled_tensor = pool_2d.apply(tf.tensor(img).expandDims(-1))

    network[1].draw(svg, pooled_tensor.squeeze(-1).arraySync(), Layer.d_to_rgb)

    let convs = []
    let kernels = ["x_sobel", "y_sobel", "edge_detection", "sharpen", "box_blur", "x_sobel", "y_sobel", "edge_detection"]
    for(let i = 0; i < kernels.length; ++i) {
        let conv = createConv([size / 2, size / 2, 1], config.kernels[kernels[i]], 1, 1, true)
        let idx = (i + 2 - ((kernels.length - 1) % 3)) % 3 // Rig this mod so that we always get the blue channel for the last one, no matter how many kernels
        let convolved = conv.apply(pooled_tensor.gather([idx])).squeeze(-1).arraySync()
        convs.push(convolved[0])
    }

    network[2].draw(svg, convs)

    pool_2d = create_max_pool_2d(4)
    pooled_tensor = pool_2d.apply(tf.tensor(convs).expandDims(-1))

    network[3].draw(svg, pooled_tensor.squeeze(-1).arraySync())
    
    
    
    network[4].draw(svg, null)

    // ------- Sliders -------

    let random_scramble = Math.floor(Math.random() * 3 + 4)/10 // Generate random value in [0.4, 0.6] to mean "unscrambled"
    console.log(random_scramble)
    let conv_1_slider = d3_slider.sliderHorizontal().min(0).max(1-0.1).width(network[2].get_total_width()).ticks(0).step(0.1).displayValue(false).on("onchange", function(s) {
        console.log(s)
        if (this.prev != undefined && Math.abs(s - this.prev) < 1e-2) {
            return
        } else {
            this.prev = s
        }
        
        // Probability of randomly re-assigning a given pixel
        let p = Math.round(Math.abs(s - random_scramble) * 10) / 10

        let data = network[2].original_data
        
        let scramble = [...Array(data.length)].map(() => random_matrix(data[0][0].length, data[0].length))
        
        for (let i = 0; i < data.length; ++i) {
            for (let j = 0; j < data[i].length; ++j) {
                for (let k = 0; k < data[i][j].length; ++k) {
                    if (Math.random() >= p) {
                        scramble[i][j][k] = data[i][j][k]
                    }
                }
            }
        }

        network[2].redraw(svg, scramble)
    });

    d3.select("#cnn-vis-main")
        .append("g")
        .attr("transform", `translate(${network[2].x}, ${network[2].get_total_height() - Math.sin(network[2].rad) * network[2].w - filter_gap})`)
        .attr("id", "slider-3")
        .call(conv_1_slider);

    // d3.select("#cnn-vis-main")
    //     .append("g")
    //     .attr("transform", "translate(575, 100)")
    //     .attr("id", "slider-2")
    //     .call(slider);

    // slider = d3_slider.sliderHorizontal().min(0).max(1).width(200).ticks(0).step(0.05).displayValue(false).on("onchange", m => {
    //     for(let i = 0; i < 16; ++i) {
    //         draw_img_3d_rect(svg, null, 800 + (i+1) * 16, 16 + 16 * Math.SQRT1_2, 32, 2, "#8A2BE2", i + 15, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
    //     }
    // });

    // d3.select("#cnn-vis-main")
    //     .append("g")
    //     .attr("transform", "translate(850, 100)")
    //     .attr("id", "slider-3")
    //     .call(slider);

    // slider = d3_slider.sliderHorizontal().min(0).max(0.9).width(100).ticks(0).step(0.1).displayValue(false).on("onchange", s => {
    //     let idx = Math.round(s * 10) | 0;
    //     let data = [...Array(1)].map(() => [...Array(10)].map(() => 0));
    //     data[idx] = 1
    //     // let exp_data = data[0].map(num => Math.exp(num * 32))
    //     // let sum = exp_data.reduce((total, cur) => total + cur)
    //     // exp_data = exp_data.map(num => num / sum)
    //     // console.log(exp_data)
    //     for(let i = 0; i < 10; ++i) {
    //         draw_img_3d_rect(svg, [[data[i]]], 1150 + (i+1) * 16, 8 + 8 * Math.SQRT1_2, 16, 1, "#8A2BE2", i + 31, (d, _) => d3.rgb(d * 255, d * 255, d * 255), 0)
    //     }
    // });

    // d3.select("#cnn-vis-main")
    //     .append("g")
    //     .attr("transform", "translate(1200, 100)")
    //     .attr("id", "slider-4")
    //     .call(slider);
}