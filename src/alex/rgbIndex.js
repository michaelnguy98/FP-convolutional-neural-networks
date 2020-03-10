import * as d3 from "d3";

function init() {
    
    d3.select("#rgbSection")
        .append("svg")
        .attr("width", window.innerWidth) // add width
        .attr("height", 1000) // add height
        .attr("id", "rgbMain")
        .append("g")
        .attr("width", window.innerWidth) // add width
        .attr("height", 1000) // add height
        .attr("id", "rgbG")

    buildrgb("https://raw.githubusercontent.com/UW-CSE442-WI20/A3-convolutional-neural-networks/michan4-v2/Images/bird.png", x => drawRGB(x))
}

function buildrgb(src, func) {
    const canvas = document.getElementById('input');
    const context = canvas.getContext('2d');

    const image = new Image();
    
    image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;

        let img = [...Array(3)].map(() => [...Array(canvas.height)].map(() => [...Array(canvas.width)].map(() => 0)));

        context.drawImage(image, 0, 0);

        const imgData = context.getImageData(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < imgData.data.length; i += 4) {
            let x = (i / 4) % canvas.width;
            let y = Math.floor((i / 4) / canvas.width);
            for (let j = 0; j < 3; ++j) {
                img[j][y][x] = imgData.data[i + j]
            }
        }

        func(img)
    }

    image.crossOrigin = "Anonymous";
    image.src = src;
}

function drawRGB(img) {
    let g = d3.select("#rgbG")
    
    for (let i = 0; i < 3; ++i) {
        draw_box(g, img[i], i * 300, 0, 256, 32, i);
    }
}

function draw_box(g, data, x, y, s, n, index) {
    let w = s / n
    let h = s / n
    // g.selectAll("square" + index).remove();
    g.selectAll("square" + index)
        .data(data.reduce((a, b) => a.concat(b), []))
        .enter()
        .append("rect")
        .attr("x", function(d, i, j) {
            return x + (i % n) * w
        })
        .attr("y", function(d, i, j) {
            return y + (n - 1 - Math.floor(i / n)) * h
        })
        .attr("width", w)
        .attr("height", h)
        .attr("fill-opacity", 1)
        .attr("fill", function(d) {
            let color = [0, 0, 0]
            color[index] = d
            return d3.rgb(color[0], color[1], color[3])
        })
        .style("cursor", "pointer")
        .on("mouseover", function(d) { d3.select(this).attr("stroke", "white") })
        .on("mouseout", function(d) { d3.select(this).attr("stroke", "none") })
        // .on("mouseout", function(d) {
        //     let color = [0, 0, 0]
        //     color[index] = d
        //     d3.select(this).attr("fill", d3.rgb(color[0], color[1], color[3]))
        // })
        .classed("square" + index, true)
        .addclass;
}

window.onload = init;