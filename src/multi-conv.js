import * as d3 from "d3";
import image1 from "../cat_conv/cat_conv1.png";
import image2 from "../cat_conv/cat_conv3.png";
import image3 from "../cat_conv/cat_conv5.png";

import puppy from "../Images/dog.png";
import puppySobel from "../Images/puppySobel.png";
import puppySobelConv from "../Images/puppySobelConv.png";
import puppyOutput from "../Images/puppyOutput.png";

let numLayers = 0;

const borderWidth = 900;
const borderHeight = 900;

const fontSize = 30;

const rectWidth = 50;
const rectHeight = 140;

const startingConvX = 50;
const startingConvY = 50;

const spacing = 120;

export function initMultiConvSection() {
    initSVG();
    drawInputImage();
    drawConvLayers();
    drawButtons();
    drawText();
}

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
 * Draws the ConvLayers
 */
export function drawConvLayers() {
    // Make Layers

    const data = [];

    for (let i = 0; i < numLayers; i++) {
        data.push(`Layer ${i + 1}`);
    }
    
    const convLayerWrappers = d3.select("#multiConvSvg")
        .selectAll(".convLayerWrapper")
        .data(data)
        .enter()
        .append("g")
        .classed("convLayerWrapper", true);

    // arrow
    convLayerWrappers.append("svg:defs").append("svg:marker")
        .attr("id", "triangle")
        .attr("refX", 0)
        .attr("refY", 3)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,0 L0,6 L9,3 z")
        .style("stroke", "black");
    
    const startLayers = startingConvX + 120
    
    //line              
    convLayerWrappers.append("line")
        .attr("x1", (_, i) => startLayers + (spacing + 100) * i)
        .attr("y1", 100)
        .attr("x2", (_, i) => startLayers + (spacing + 100) * i + 75)
        .attr("y2", 100)          
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .attr("marker-end", "url(#triangle)")
        .classed("layerArrow", true);

    //text
    convLayerWrappers.append("text")
        .attr("x", (_, i) => startLayers + (spacing + 100) * i + 40)
        .attr("y", 75)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text("Convolution");

    const imageWidth = 100;
    const imageHeight = 100; 

    //image
    convLayerWrappers.append("svg:image")
        .attr("x", (_, i) => startLayers + (spacing + 100) * i + 105)
        .attr("y", startingConvY)
        .attr("width", imageWidth)
        .attr("height", imageHeight)
        .attr("stroke", "black")
        .attr('xlink:href', (_, i) => {
            let img;
            if (i+1 == 1) {
                img = puppySobel;
            } else if (i+1 == 2) {
                img = puppySobelConv;
            } else if (i+1 == 3) {
                img = puppyOutput;
            }
            return img;
        });

    const imageY = startingConvY;

    convLayerWrappers.append("text")
        .attr("x", (_, i) => startLayers + (spacing + 100) * i + 105 + imageWidth / 2)
        .attr("y", imageY - imageHeight / 10)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text((_, i) => `Layer ${i+1}`);

    d3.select("#multiConvSvg")
        .selectAll(".convLayerText")
        .data(data)
        .text((d) => d);

    d3.select("#multiConvSvg")
        .selectAll(".convLayerWrapper")
        .data(data)
        .exit()
        .remove();
}

export function drawButtons() {
    // Make Button
    const buttonWidth = 3 * rectWidth;
    const buttonHeight = 50;

    const buttonX = startingConvX + (spacing * (3 - 1) + rectWidth) / 2 - buttonWidth / 2;
    const buttonY = startingConvY + rectHeight + 75;
    
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
export function drawInputImage() {
    const imageWidth = 100;
    const imageHeight = 100; 
    
    let imageX = startingConvX;
    let imageY = startingConvY;
    
    const imageWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "imageWrapper");
    imageWrapper.append("svg:image")
        .attr("x", imageX)
        .attr("y", imageY)
        .attr("width", imageWidth)
        .attr("height", imageHeight)
        .attr('xlink:href', puppy)
        .attr("stroke", "black");
    imageWrapper.append("text")
        .attr("x", imageX + imageWidth / 2)
        .attr("y", imageY - imageHeight / 10)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text("Input");
    
}

/**
 * Draws the text
 */
export function drawText() {
    const imageWidth = 100;
    const imageHeight = 100; 
    
    let imageX = startingConvX + 75;
    let imageY = startingConvY + 100;
    
    const imageWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "textWrapper");
    imageWrapper.append("text")
        .attr("x", imageX + spacing + imageWidth / 2)
        .attr("y", imageY + imageHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .attr("dy", "0em")
        .text("Here is the puppy image.")
        .classed("descriptionText", true);
    imageWrapper.append("text")
        .attr("x", imageX + spacing + imageWidth / 2)
        .attr("y", imageY + imageHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .attr("dy", "1em")
        .text("Lets apply a convolution to it!")
        .classed("descriptionText2", true);;
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
            if (numLayers > 0) {
                d3.select("#removeButtonWrapper")
                    .attr("visibility", "visible")
            }
            if (numLayers >= 3) {
                d3.select("#addButtonWrapper")
                    .attr("visibility", "hidden");
            }
            break;
        case 'REMOVE':
            if (numLayers > 0) {
                numLayers--;
            }
            if (numLayers < 3) {
                d3.select("#addButtonWrapper")
                    .attr("visibility", "visible")
            }
            if (numLayers <= 0) {
                d3.select("#removeButtonWrapper")
                    .attr("visibility", "hidden");
            }
            break;
        default:

    }

    let txt;
    let txt2;
    if (numLayers == 1) {
        txt = "Parts of the puppy seem to be more prominent.";
        txt2 = "Let's apply another convolution!";
    } else if (numLayers == 2) {
        txt = "A region around the feet and legs are being highlighted.";
        txt2 = "Let's apply another convolution!";
    } else if (numLayers == 3) {
        txt = "The eyes of the puppy are highlighted the most.";
        txt2 = "Maybe our network is searching for these kinds of features...";
    } else {
        txt = "Here is the puppy image.";
        txt2 = "Let's apply a convolution to it!";
    }
    d3.select("#textWrapper")
        .select(".descriptionText")
        .text(txt);
    d3.select("#textWrapper")
        .select(".descriptionText2")
        .text(txt2);

    drawConvLayers();
}