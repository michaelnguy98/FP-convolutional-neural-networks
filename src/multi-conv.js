import * as d3 from "d3";
import image1 from "../cat_conv/cat_conv1.png";
import image2 from "../cat_conv/cat_conv3.png";
import image3 from "../cat_conv/cat_conv5.png";

let numLayers = 1;

const borderWidth = 900;
const borderHeight = 900;

const fontSize = 30;

const rectWidth = 50;
const rectHeight = 140;

const startingConvX = 50;
const startingConvY = 50;

const spacing = 150;

/**
 * Initialize the SVG.
 */
export function initSVG() {
    d3.select("#multiConvSection")
        .append("svg")
        .attr("id", "multiConvSvg")
        .attr("width", borderWidth)
        .attr("height", borderHeight);
}

/**
 * Draws the Layers
 */
export function drawLayers() {
    // Make Layers

    const data = ["Input"];

    for (let i = 1; i <= numLayers; i++) {
        data.push(`Conv ${i}`);
    }

    data.push("Output");
    
    const layerWrappers = d3.select("#multiConvSvg")
        .selectAll(".layerWrapper")
        .data(data)
        .enter()
        .append("g")
        .classed("layerWrapper", true);
    layerWrappers.append("rect")
        .attr("x", (_, i) => startingConvX + spacing * i)
        .attr("y", startingConvY)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("fill", "white")
        .attr("stroke", "black")
        .classed("layerRect", true);
    layerWrappers.append("text")
        .attr("x", -1 * (startingConvY + rectHeight / 2))
        .attr("y", (_, i) => 1 * (startingConvX + spacing * i + rectWidth / 2))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize)
        .attr("transform", "rotate(-90)")
        .classed("layerText", true);    

    d3.select("#multiConvSvg")
        .selectAll(".layerText")
        .data(data)
        .text((d) => d);

    d3.select("#multiConvSvg")
        .selectAll(".layerWrapper")
        .data(data)
        .exit()
        .remove();
}

export function drawButtons() {
    // Make Button
    const buttonWidth = 3 * rectWidth;
    const buttonHeight = 50;

    const buttonX = startingConvX + (spacing * (3 - 1) + rectWidth) / 2 - buttonWidth / 2;
    const buttonY = startingConvY + rectHeight + 50;
    
    // This is the Add Layer Button
    const addButtonWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "addButtonWrapper");
    addButtonWrapper.append("rect")
        .attr("x", buttonX)
        .attr("y", buttonY)
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("fill", "white")
        .attr("stroke", "black")
        .style("cursor", "pointer")
        .on("click", () => updateState(actions.ADD))
        .classed("buttonRect", true);
    addButtonWrapper.append("text")
        .attr("x", buttonX + buttonWidth / 2)
        .attr("y", buttonY + buttonHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text("Add Layer")
        .classed("buttonText", true);

    let buttonSpacing = 200;

    // This is the Remove Layer Button
    const removeButtonWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "removeButtonWrapper")
        .attr("visibility", "hidden");
    removeButtonWrapper.append("rect")
        .attr("x", buttonX + buttonSpacing)
        .attr("y", buttonY)
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("fill", "white")
        .attr("stroke", "black")
        .style("cursor", "pointer")
        .on("click", () => updateState(actions.REMOVE))
        .classed("buttonRect", true);
    removeButtonWrapper.append("text")
        .attr("x", buttonX + buttonSpacing + buttonWidth / 2)
        .attr("y", buttonY + buttonHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text("Remove Layer")
        .classed("buttonText", true);
}

/**
 * Draws the image and text
 */
export function drawImageAndText() {
    const imageWidth = 100;
    const imageHeight = 100; 
    
    let imageX = startingConvX + 50;
    let imageY = startingConvY + rectHeight + 150;
    
    const imageWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "imageWrapper");
    imageWrapper.append("svg:image")
        .attr("x", imageX)
        .attr("y", imageY)
        .attr("width", imageWidth)
        .attr("height", imageHeight)
        .attr('xlink:href', image1)
        .attr("stroke", "black")
        .classed("imageRect", true);
    imageWrapper.append("text")
        .attr("x", imageX + spacing + imageWidth / 2)
        .attr("y", imageY + imageHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text("Blah Blah Blah")
        .classed("imageText", true);
}

const actions = {
    ADD: 'ADD',
    REMOVE: 'REMOVE'
}

/**
 * Updates the states of the layers
 */
export function updateState(action) {
    switch (action) {
        case 'ADD':
            if (numLayers <= 2) {
                numLayers++;
            }
            if (numLayers > 1) {
                d3.select("#removeButtonWrapper")
                    .attr("visibility", "visible")
            }
            if (numLayers >= 3) {
                d3.select("#addButtonWrapper")
                    .attr("visibility", "hidden");
            }
            break;
        case 'REMOVE':
            if (numLayers > 1) {
                numLayers--;
            }
            if (numLayers < 3) {
                d3.select("#addButtonWrapper")
                    .attr("visibility", "visible")
            }
            if (numLayers <= 1) {
                d3.select("#removeButtonWrapper")
                    .attr("visibility", "hidden");
            }
            break;
        default:

    }

    let img;
    let txt;
    if (numLayers == 1) {
        img = image1;
        txt = "Blah Blah Blah";
    } else if (numLayers == 2) {
        img = image2;
        txt = "Bleep Bloop";
    } else if (numLayers == 3) {
        img = image3;
        txt = "Crack a cold one";
    }
    d3.select("#imageWrapper")
        .select(".imageRect")
        .attr('xlink:href', img);
    d3.select("#imageWrapper")
        .select(".imageText")
        .text(txt);

    drawLayers();
}