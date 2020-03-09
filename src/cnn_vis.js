import * as d3 from "d3";
import * as config from "./config";
import * as d3_slider from "d3-simple-slider"
import * as d3_drag from "d3-drag"

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
    constructor(x, y, w, h, size, filters, filter_gap, kernel_size, no_overlap=false) {
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

        this.is_current = false

        // Only allow this mode if kernel divides image size
        console.assert(!no_overlap || size / kernel_size - Math.floor(size / kernel_size) == 0)

        this.rad = Math.PI / 4
    }

    static link_layers(layers) {
        for(let i = 0; i < layers.length; ++i) {
            layers[i].layer_index = i
            layers[i].prev_layer = i > 0 ? layers[i - 1] : null;
            layers[i].next_layer = i < layers.length - 1 ? layers[i + 1] : null;
        }
    }

    get_total_height() {
        let y_scale = Math.sin(this.rad)
        return this.h + y_scale * this.width
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

    calc_cell_width() {
        return this.w / this.size
    }

    calc_cell_height () {
        return this.h / this.size
    }

    draw_layer_connection(svg, cell_index, input_size=1) {
        let cell_width = this.calc_cell_width()
        let cell_height = this.calc_cell_height()

        let c = Math.floor((this.kernel_size-1)/2)
        let x_scale = Math.cos(this.rad)
        let y_scale = Math.sin(this.rad)

        let col = cell_index % this.size
        let row = this.size - 1 - Math.floor(cell_index / this.size)
        let col_block = col
        let row_block = row

        if (this.no_overlap) {
            col_block = Math.floor(col / input_size) * input_size
            row_block = Math.floor(row / input_size) * input_size
        }
        else {
            col_block = col - (this.kernel_size - 1) / 2
            row_block = row - (this.kernel_size - 1) / 2
        }

        // Select cell coordinates
        let x_block_base = this.x + col_block * x_scale * cell_width
        let y_block = this.y - row_block * cell_height - col_block * y_scale * cell_height

        // let x_cell_base = this.x + col * x_scale * cell_width
        // let y_cell = this.y - row * cell_height - col * y_scale * cell_height

        let output_size = this.is_current ? 1 : this.kernel_size * 2 - 1

        for (let filter_idx = 0; filter_idx < this.filters; ++filter_idx) {
            // let x_cell = x_cell_base + this.filter_gap * filter_idx
            // let x_cell_next = x_cell_base + this.filter_gap * (filter_idx + 1)

            let x_block = x_block_base + this.filter_gap * filter_idx
            let x_block_next = x_block_base + this.filter_gap * (filter_idx + 1)

            if (this.is_current || (this.prev_layer != null && this.prev_layer.is_current)) {
                let size = this.is_current ? input_size : 1
                // Draw kernel rectangle in the right z order
                this.draw_3d_rect_vertical(svg.insert("polygon", "#outline-" + this.layer_index + "-" + (filter_idx + 1)),
                                        x_block, y_block, cell_width * size, cell_height * size, this.rad, 0, 0,
                                        null, 0, "#39FF14", 1).attr("pointer-events", "none").attr("id", "kernel-" + this.layer_index + "-" + filter_idx)
            }

            if (!this.is_current) {
                // let rf_width_right = Math.min(this.kernel_size - 1, this.size - col_block - 1)
                // let rf_width_left = Math.min(this.kernel_size - 1, col_block)
                // let rf_width = rf_width_left + rf_width_right + 1

                // let rf_height_top = Math.min(this.kernel_size - 1, this.size - row_block - 1)
                // let rf_height_bottom = Math.min(this.kernel_size - 1, row_block)
                // let rf_height = rf_height_bottom + rf_height_top + 1

                // Draw rf rectangle in the right z order
                this.draw_3d_rect_vertical(svg.insert("polygon", "#outline-" + this.layer_index + "-" + (filter_idx + 1)),
                                           x_block - x_scale * (this.kernel_size - 1) * cell_width,
                                           y_block + (this.kernel_size - 1) * cell_height + y_scale *(this.kernel_size - 1) * cell_width,
                                           cell_width * output_size,
                                           cell_height * output_size,
                                           this.rad, 0, 0, null, 0, "red", 1)
                                           .attr("pointer-events", "none")
                                           .attr("id", "rf-" + this.layer_index + "-" + filter_idx)
            }


            // Draw connection lines between the kernels in same layer
            if (filter_idx == this.filters - 1) {
                break
            }

            for (let i = 0; i < 4; ++i) {
                // Trick to do all of this in one loop. Generates -1 -1; -1, 1; 1, -1; 1, 1.
                // These are used to calculate the offsets to the corners from the center of the cell
                let sign_x = i & 1
                let sign_y = (i >> 1) & 1
                
                let x_offset = sign_x * x_scale * input_size * cell_width
                let y_offset = sign_y * input_size * cell_height + sign_x * y_scale * input_size * cell_width
    
                // Connect input with output
                svg.select("#connection-line--" + this.layer_index + "-" + filter_idx + "-" + i).remove()
                svg.insert("line", "#outline-" + this.layer_index + "-" + (filter_idx + 1))
                    .attr("x1", x_block + x_offset)
                    .attr("y1", y_block - y_offset)
                    .attr("x2", x_block_next + x_offset)
                    .attr("y2", y_block - y_offset)
                    .attr("pointer-events", "none")
                    .attr("stroke-dasharray", 2)
                    .attr("stroke", "#39FF14")
                    .attr("stroke-width", 2)
                    .attr("id", "connection-line-" + this.layer_index + "-" + filter_idx + "-" + i)
            }
        }

        // Draw connection lines to next layer, first filter, shotout to A3  
        let filter_idx = this.filters - 1
        
        let rf_col = cell_index % this.size 
        let rf_row = this.size - 1 - Math.floor(cell_index / this.size)

        if (this.no_overlap) {
            rf_col = Math.floor(rf_col / input_size) * input_size
            rf_row = Math.floor(rf_row / input_size) * input_size
        }
        else {
            rf_col = rf_col - (this.kernel_size )
            rf_row = rf_row - (this.kernel_size )
        }

        let rf_x = this.x + rf_col * x_scale * cell_width+ this.filter_gap * filter_idx
        let rf_y = this.y - rf_row * cell_height - rf_col * y_scale * cell_height
    
        if (this.next_layer == null)
            return;

        if (this.no_overlap) {
            var col_out = Math.floor(col_block / input_size)
            var row_out = Math.floor(row_block / input_size)
        }
        else {
            var col_out = rf_col
            var row_out = rf_row
        }

        let x_cell_out = this.next_layer.x + this.next_layer.filter_gap * 0 + col_out * x_scale * this.next_layer.calc_cell_width()
        let y_cell_out = this.next_layer.y - row_out * this.next_layer.calc_cell_height() - col_out * y_scale * this.next_layer.calc_cell_height()
        
        let size = this.is_current ? input_size : output_size
        for (let i = 0; i < 4; ++i) {
            // Trick to do all of this in one loop. Generates -1 -1; -1, 1; 1, -1; 1, 1.
            // These are used to calculate the offsets to the corners from the center of the cell
            let sign_x = i & 1
            let sign_y = (i >> 1) & 1

            let x_offset = sign_x * x_scale * (size) * cell_width
            let y_offset = sign_y * (size) * cell_height + sign_x * y_scale * (size) * cell_width

            let x_out_offset = sign_x * x_scale * this.next_layer.calc_cell_width()
            let y_out_offset = sign_y * this.next_layer.calc_cell_height() + sign_x * y_scale * this.next_layer.calc_cell_width()

            // Connect input with output
            svg.select("#connection-line--" + this.layer_index + "-" + filter_idx + "-" + i).remove()
            svg.insert("line", "#outline-" + (this.layer_index + 1) + "-0")
                .attr("x1", rf_x + x_offset)
                .attr("y1", rf_y - y_offset)
                .attr("x2", x_cell_out + x_out_offset)
                .attr("y2", y_cell_out - y_out_offset)
                .attr("pointer-events", "none")
                .attr("stroke-dasharray", 2)
                .attr("stroke", size == 5 ? "red" : "#39FF14")
                .attr("stroke-width", 2)
                .attr("id", "connection-line-" + this.layer_index + "-" + filter_idx + "-" + i)
        }

        return [this.next_layer != null ? (this.next_layer.size - 1 - row_out) * this.next_layer.size + col_out : -1, output_size]
    }

    remove_layer_connection(svg) {
        for (let filter_idx = 0; filter_idx < this.filters; ++filter_idx) {
            svg.select("#kernel-" + this.layer_index + "-" + filter_idx).remove()
            svg.select("#rf-" + this.layer_index + "-" + filter_idx).remove()

            for (let i = 0; i < 4; ++i) {
                svg.select("#connection-line-" + this.layer_index + "-" + filter_idx + "-" + i).remove()
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

    draw(svg, data, color_fn=Layer.d_to_gray) {
        let cell_width = this.calc_cell_width()
        let cell_height = this.calc_cell_height()
        
        let layer = this

        for(let filter_idx = 0; filter_idx < this.filters; ++filter_idx) {
            // Remove previously drawn layer
            svg.selectAll(".layer-" + this.layer_index + "-" + filter_idx).remove();

            // Draw outline
            this.draw_3d_rect_vertical(svg.append("polygon"), this.x + this.filter_gap * filter_idx, this.y, this.w, this.h, this.rad, 0, 0, null, 0, "purple", 4)
                .attr("id", "outline-" + this.layer_index + "-" + filter_idx)
            
            let img = data == null ? random_matrix(this.size, this.size) : data[filter_idx]
            
            svg.selectAll(".layer-" + this.layer_index + "-" + filter_idx)
                .data(flatten(img))
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
                .on("mouseover", function(d, i, b) {
                    layer.is_current = true
                    d3.select(this).attr("fill", "yellow")

                    let result = layer.draw_layer_connection(svg, i, layer.kernel_size)
                    let idx = result[0]
                    let output_size = result[1]

                    if (idx >= 0)
                        layer.next_layer.draw_layer_connection(svg, idx, output_size)                   
                })
                .on("mouseout", function(d) {
                    d3.select(this).attr("fill", color_fn(d, filter_idx))

                    let cur = layer
                    while (cur != null) {
                        cur.remove_layer_connection(svg)
                        cur = cur.next_layer
                    }
                    layer.is_current = false
                })
                .classed("layer-" + layer.layer_index + "-" + filter_idx, true)
                .exit();
        }
    }
}


function make_centered_layer(x, w, h, size, filters, filter_gap, kernel_size, no_overlap=false) {
    return new Layer(x, h/2 * (1 + Math.SQRT1_2), w, h, size, filters, filter_gap, kernel_size, no_overlap)
}


function draw_cnn_vis(img) {
    let svg = d3.select("#cnn-vis")

    let layers = []

    let filter_gap = 32
    let x_start = filter_gap

    layers.push(make_centered_layer(x_start, 256, 256, 32, 3, filter_gap, 2, true))
    layers.push(make_centered_layer(layers[0].x + layers[0].get_total_width() + filter_gap * 4, 128, 128, 16, 4, filter_gap, 3))
    layers.push(make_centered_layer(layers[1].x + layers[1].get_total_width() + filter_gap * 4, 128, 128, 16, 8, filter_gap, 3))

    Layer.link_layers(layers)

    layers[0].draw(svg, img, Layer.d_to_rgb)
    layers[1].draw(svg, null)
    layers[2].draw(svg, null)

    // ------- Layers -------

    // for(let i = 0; i < 3; ++i) {
    //     draw_img_3d_rect(svg, img[i], (i+1) * 25, 128 + 128 * Math.SQRT1_2, 256, 32, "white", i, gray_to_rgb)
    // }

    // for(let i = 0; i < 4; ++i) {
    //     draw_img_3d_rect(svg, null, 300 + (i+1) * 25, 64 + 64 * Math.SQRT1_2, 128, 8, "#8A2BE2", i + 3, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
    // }

    // for(let i = 0; i < 8; ++i) {
    //     draw_img_3d_rect(svg, null, 500 + (i+1) * 25, 32 + 32 * Math.SQRT1_2, 64, 4, "#8A2BE2", i + 7, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
    // }

    // for(let i = 0; i < 16; ++i) {
    //     draw_img_3d_rect(svg, null, 800 + (i+1) * 16, 16 + 16 * Math.SQRT1_2, 32, 2, "#8A2BE2", i + 15, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
    // }

    // for(let i = 0; i < 10; ++i) {
    //     draw_img_3d_rect(svg, [[i==0|0]], 1150 + (i+1) * 16, 8 + 8 * Math.SQRT1_2, 16, 1, "#8A2BE2", i + 31, (d, _) => d3.rgb(d * 255, d * 255, d * 255), 0)
    // }

    // let slider = d3_slider.sliderHorizontal().min(0).max(1).width(100).ticks(0).step(0.2).displayValue(false).on("onchange", m => {
    //     for(let i = 0; i < 4; ++i) {
    //         draw_img_3d_rect(svg, null, 300 + (i+1) * 25, 64 + 64 * Math.SQRT1_2, 128, 8, "#8A2BE2", i + 3, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
    //     }
    // });

    // ------- Connections -------

    // draw_layer_connection(svg, 75, 128 + 128 * Math.SQRT1_2, 256, 256, 32, 325, 64 + 64 * Math.SQRT1_2, 128, 128, "red")
    // draw_layer_connection(svg, 75, 128 + 128 * Math.SQRT1_2, 256, 256, 32, 325, 64 + 64 * Math.SQRT1_2, 128, 128, "green")
    // draw_layer_connection(svg, 75, 128 + 128 * Math.SQRT1_2, 256, 256, 32, 325, 64 + 64 * Math.SQRT1_2, 128, 128, "blue")



    // ------- Sliders -------

    // d3.select("#cnn-vis-main")
    //     .append("g")
    //     .attr("transform", "translate(350, 100)")
    //     .attr("id", "slider-1")
    //     .call(slider);

    // slider = d3_slider.sliderHorizontal().min(0).max(1).width(150).ticks(0).step(0.1).displayValue(false).on("onchange", m => {
    //     for(let i = 0; i < 8; ++i) {
    //         draw_img_3d_rect(svg, null, 500 + (i+1) * 25, 32 + 32 * Math.SQRT1_2, 64, 4, "#8A2BE2", i + 7, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
    //     }
    //     });

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