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

    buildrgb("https://opengameart.org/sites/default/files/Pixel_Bird_png_0.png", x => drawRGB(x))
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

    let s = 256
    let n = 64
    let w = s / n
    let h = s / n
    g.selectAll("squareO")
        .data(img[0].reduce((a, b) => a.concat(b)))
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
            return 300 + (i % n) * w
        })
        .attr("y", function(d, i) {
            return (Math.floor(i / n)) * h
        })
        .attr("width", w)
        .attr("height", h)
        .attr("fill-opacity", 1)
        .attr("fill", function(d, i) {
            let color = [d, 
                img[1].reduce((a, b) => a.concat(b))[i],
                img[2].reduce((a, b) => a.concat(b))[i]]
            return d3.rgb(color[0], color[1], color[2])
        })
        .style("cursor", "pointer")
        .on("mouseover", function(d, i) {
            d3.select(this).attr("stroke", "white")
            let nums = [0, 1, 2]
            g.selectAll("selected")
                .data(nums)
                .enter()
                .append("rect")
                .attr("x", function(d) {
                    return d * 300 + (i % n) * w
                })
                .attr("y", function(d) {
                    return 300 + (Math.floor(i / n)) * h
                })  
                .attr("width", w)
                .attr("height", h)
                .attr("stroke", "white")
                .attr("fill-opacity", 0)
                .classed("selected", true);
        })
        .on("mouseout", function(d) {
            d3.select(this).attr("stroke", "none")
            g.selectAll("rect.selected").remove()
        })
        .classed("squareO", true);
    
    for (let i = 0; i < 3; ++i) {
        draw_box(g, img, i * 300, 300, s, n, i);
    }
}

function draw_box(g, img, x, y, s, n, index) {
    let data = img[index]
    let w = s / n
    let h = s / n
    // g.selectAll("square" + index).remove();
    g.selectAll("square" + index)
        .data(data.reduce((a, b) => a.concat(b), []))
        .enter()
        .append("rect")
        .attr("x", function(d, i) {
            return x + (i % n) * w
        })
        .attr("y", function(d, i) {
            return y + (Math.floor(i / n)) * h
        })
        .attr("width", w)
        .attr("height", h)
        .attr("fill-opacity", 1)
        .attr("fill", function(d) {
            let color = [0, 0, 0]
            color[index] = d
            return d3.rgb(color[0], color[1], color[2])
        })
        .style("cursor", "pointer")
        .on("mouseover", function(d, i) {
            d3.select(this).attr("stroke", "white")
            let nums = [0, 1, 2]
            g.selectAll("selected")
                .data(nums)
                .enter()
                .append("rect")
                .attr("x", function(d) {
                    if (d == index) {
                        return 300 + (i % n) * w
                    }
                    return d * 300 + (i % n) * w
                })
                .attr("y", function(d) {
                    if (d == index) {
                        return (Math.floor(i / n)) * h
                    }
                    return y + (Math.floor(i / n)) * h
                })  
                .attr("width", w)
                .attr("height", h)
                .attr("stroke", "white")
                .attr("fill-opacity", 0)
                .classed("selected", true);
        })
        .on("mouseout", function(d) {
            d3.select(this).attr("stroke", "none")
            g.selectAll("rect.selected").remove()
        })
        .classed("square" + index, true);
}

window.onload = init;