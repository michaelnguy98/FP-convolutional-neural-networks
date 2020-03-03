import * as d3 from "d3";
import * as config from "./config";
import * as d3_slider from "d3-simple-slider"
import * as d3_drag from "d3-drag"

function load_img_channels(url, callback) {
    const canvas = document.getElementById('input-image');
    const context = canvas.getContext('2d');

    const pixelValues = [];

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
    
    d3.select("body")
    .append("div")
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

function draw_3d_rect_horizontal(svg, x, y, w, h, rad, color, opacity, stroke_color) {
    let x_scale = Math.cos(rad)
    let y_scale = Math.sin(rad)
    let corners = [[x, y], [x + w, y], [x + w + x_scale * h, y - y_scale * h], [x + x_scale * h, y - y_scale * h]]

    return draw_quadrilateral(svg, corners, color, opacity, stroke_color)
}

function draw_3d_rect_vertical(svg, x, y, w, h, rad, color, opacity, stroke_color) {
    let x_scale = Math.cos(rad)
    let y_scale = Math.sin(rad)
    let corners = [[x, y], [x + x_scale * w, y - y_scale * w], [x + x_scale * w, y - h - y_scale * w], [x, y - h]]

    return draw_quadrilateral(svg, corners, color, opacity, stroke_color)
}

function draw_quadrilateral(svg, points, color, opacity, stroke_color) {
    return svg.append("polygon")
    .attr("points", `${points[0][0]}, ${points[0][1]} ${points[1][0]}, ${points[1][1]} ${points[2][0]}, ${points[2][1]} ${points[3][0]}, ${points[3][1]}`)
    .attr("fill-opacity", opacity)
    .attr("fill", color)
    .attr("stroke", stroke_color)
    .attr("stroke-width", 4)
    .style("cursor", "pointer")
    .on("mouseover", function() { d3.select(this).attr("fill", "yellow") })
    .on("mouseout", function() { d3.select(this).attr("fill", color) });
}

function draw_3d_cube(svg, x, y, w, h, d, rad, color) {
    draw_3d_rect_vertical(svg, x, y, w, h, 0, color)
    draw_3d_rect_vertical(svg, x + w, y, d, h, rad, color)
    draw_3d_rect_horizontal(svg, x, y - h, w, d, rad, color)
}

function draw_nested_cube(svg, x, y, w, h, n, dx, rad, color) {
    draw_3d_rect_vertical(svg, x, y, dx * (n - 1), h, 0, color, 0, color)
    draw_3d_rect_horizontal(svg, x, y - h, dx * (n - 1), h, rad, color, 0, color)

    for(let i = 0; i < n - 1; ++i) {
        draw_3d_rect_vertical(svg, x + i * dx, y, w, h, rad, "white", 1, color)
    }

    draw_3d_rect_vertical(svg, x + dx * (n - 1), y, w, h, rad, "white", 1, color)
}

function flatten(a) {
    return a.reduce((acc, val) => acc.concat(val), []);
}

function random_matrix(w, h) {
    return [...Array(h)].map(() => [...Array(w)].map(() => Math.random(0)));
}

function gray_to_rgb(d, rgb_idx) {
    let color = [d / 2, d / 2, d / 2]
    color[rgb_idx % 3] *= 2
    return d3.rgb(color[0], color[1], color[2])
}

function draw_img_3d_rect(svg, data, x, y, s, n, stroke_color, color_idx, color_fn, rad=Math.PI/4) {
    if (data == null) {
        data = random_matrix(n, n)
    }

    let w = s / n
    let h = s / n
    svg.selectAll(".sq" + color_idx).remove();
    draw_3d_rect_vertical(svg, x, y, s, s, rad, "red", 0, stroke_color)
    let enter = svg.selectAll(".sq" + color_idx)
        .data(flatten(data))
        .enter()
        .append("polygon")
        .attr("points", function(data, i, cells) {
            let x_scale = Math.cos(rad)
            let y_scale = Math.sin(rad)

            let col = i % n
            let row = n - 1 - Math.floor(i / n)

            let x_cell = x + col * x_scale * w
            let y_cell = y - row * h - col * y_scale * h 

            let points = [[x_cell, y_cell], [x_cell + x_scale * w, y_cell - y_scale * w], [x_cell + x_scale * w, y_cell - h - y_scale * w], [x_cell, y_cell - h]]

            return `${points[0][0]}, ${points[0][1]} ${points[1][0]}, ${points[1][1]} ${points[2][0]}, ${points[2][1]} ${points[3][0]}, ${points[3][1]}`
        })
        .attr("fill-opacity", 1)
        .attr("fill", d => color_fn(d, color_idx))
        .style("cursor", "pointer")
        .on("mouseover", function(d) { d3.select(this).attr("fill", "yellow") })
        .on("mouseout", function(d) { d3.select(this).attr("fill", color_fn(d, color_idx)) })
        .classed("sq" + color_idx, true)
        .exit();
}

// function draw_nested_rand_cube(svg, x, y, w, h, n, dx, rad, color) {
//     draw_3d_rect_vertical(svg, x, y, dx * (n - 1), h, 0, color, 0, color)
//     draw_3d_rect_horizontal(svg, x, y - h, dx * (n - 1), h, rad, color, 0, color)

//     for(let i = 0; i < n; ++i) {
//         draw_random_3d_rect(svg, x + i * dx, y, w, 6, "#00BFFF", i + 100, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
//     }
// }


function unique_id() {
    unique_id.id =  unique_id.id + 1 || 1;
    return "element-" + unique_id.id
}

function draw_layer_connection(svg, start_x, start_y, start_w, start_h, start_n,
    end_x, end_y, end_w, end_h, color) {
    
    let id = unique_id();
    let rect = draw_3d_rect_vertical(svg, start_x, start_y, start_w / start_n, start_h / start_n, Math.PI / 4, color, 1, null).attr("id", id)
    let line = svg.append("line")
                    .attr("x1", start_x)
                    .attr("y1", start_y)
                    .attr("x2", end_x)
                    .attr("y2", end_y - end_h / 2)
                    .attr("stroke", "red")
                    .attr("stroke-width", 2)
    
    let drag = d3.drag().on("drag", function() {
        d3.select("#" + id).remove()
        rect = draw_3d_rect_vertical(svg, d3.event.x, d3.event.y, start_w / start_n, start_h / start_n, Math.PI / 4, color, 1, null).attr("id", id)
        rect.call(drag)
        line.attr("x1", d3.event.x)
            .attr("y1", d3.event.y)
            .attr("x2", end_x)
            .attr("y2", end_y - end_h / 2)
    });
    
    rect.call(drag)
}


function draw_cnn_vis(img) {
    let svg = d3.select("#cnn-vis")

    draw_nested_cube(svg, 200, 250, 50, 50, 32, 10, Math.PI / 3, "black")


    for(let i = 0; i < 3; ++i) {
        draw_img_3d_rect(svg, img[i], (i+1) * 25, 128 + 128 * Math.SQRT1_2, 256, 32, "white", i, gray_to_rgb)
    }

    for(let i = 0; i < 4; ++i) {
        draw_img_3d_rect(svg, null, 300 + (i+1) * 25, 64 + 64 * Math.SQRT1_2, 128, 8, "#8A2BE2", i + 3, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
    }

    for(let i = 0; i < 8; ++i) {
        draw_img_3d_rect(svg, null, 500 + (i+1) * 25, 32 + 32 * Math.SQRT1_2, 64, 4, "#8A2BE2", i + 7, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
    }

    for(let i = 0; i < 16; ++i) {
        draw_img_3d_rect(svg, null, 800 + (i+1) * 16, 16 + 16 * Math.SQRT1_2, 32, 2, "#8A2BE2", i + 15, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
    }

    for(let i = 0; i < 10; ++i) {
        draw_img_3d_rect(svg, [[i==0|0]], 1150 + (i+1) * 16, 8 + 8 * Math.SQRT1_2, 16, 1, "#8A2BE2", i + 31, (d, _) => d3.rgb(d * 255, d * 255, d * 255), 0)
    }

    let slider = d3_slider.sliderHorizontal().min(0).max(1).width(100).ticks(0).step(0.2).displayValue(false).on("onchange", m => {
        for(let i = 0; i < 4; ++i) {
            draw_img_3d_rect(svg, null, 300 + (i+1) * 25, 64 + 64 * Math.SQRT1_2, 128, 8, "#8A2BE2", i + 3, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
        }
    });

    draw_layer_connection(svg, 75, 128 + 128 * Math.SQRT1_2, 256, 256, 32, 325, 64 + 64 * Math.SQRT1_2, 128, 128, "red")
    draw_layer_connection(svg, 75, 128 + 128 * Math.SQRT1_2, 256, 256, 32, 325, 64 + 64 * Math.SQRT1_2, 128, 128, "green")
    draw_layer_connection(svg, 75, 128 + 128 * Math.SQRT1_2, 256, 256, 32, 325, 64 + 64 * Math.SQRT1_2, 128, 128, "blue")

    d3.select("#cnn-vis-main")
        .append("g")
        .attr("transform", "translate(350, 100)")
        .attr("id", "slider-1")
        .call(slider);

    slider = d3_slider.sliderHorizontal().min(0).max(1).width(150).ticks(0).step(0.1).displayValue(false).on("onchange", m => {
        for(let i = 0; i < 8; ++i) {
            draw_img_3d_rect(svg, null, 500 + (i+1) * 25, 32 + 32 * Math.SQRT1_2, 64, 4, "#8A2BE2", i + 7, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
        }
        });

    d3.select("#cnn-vis-main")
        .append("g")
        .attr("transform", "translate(575, 100)")
        .attr("id", "slider-2")
        .call(slider);

    slider = d3_slider.sliderHorizontal().min(0).max(1).width(200).ticks(0).step(0.05).displayValue(false).on("onchange", m => {
        for(let i = 0; i < 16; ++i) {
            draw_img_3d_rect(svg, null, 800 + (i+1) * 16, 16 + 16 * Math.SQRT1_2, 32, 2, "#8A2BE2", i + 15, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
        }
    });

    d3.select("#cnn-vis-main")
        .append("g")
        .attr("transform", "translate(850, 100)")
        .attr("id", "slider-3")
        .call(slider);

    slider = d3_slider.sliderHorizontal().min(0).max(0.9).width(100).ticks(0).step(0.1).displayValue(false).on("onchange", s => {
        let idx = Math.round(s * 10) | 0;
        let data = [...Array(1)].map(() => [...Array(10)].map(() => 0));
        data[idx] = 1
        // let exp_data = data[0].map(num => Math.exp(num * 32))
        // let sum = exp_data.reduce((total, cur) => total + cur)
        // exp_data = exp_data.map(num => num / sum)
        // console.log(exp_data)
        for(let i = 0; i < 10; ++i) {
            draw_img_3d_rect(svg, [[data[i]]], 1150 + (i+1) * 16, 8 + 8 * Math.SQRT1_2, 16, 1, "#8A2BE2", i + 31, (d, _) => d3.rgb(d * 255, d * 255, d * 255), 0)
        }
    });

    d3.select("#cnn-vis-main")
        .append("g")
        .attr("transform", "translate(1200, 100)")
        .attr("id", "slider-4")
        .call(slider);


    // for(let i = 0; i < 10; ++i) {
    //     draw_random_3d_rect(svg, 800 + (i+1) * 25, 64 + 64 * Math.SQRT1_2, 128, 8, "#8A2BE2", i, (d, _) => d3.rgb(d * 255, d * 255, d * 255))
    // }
}