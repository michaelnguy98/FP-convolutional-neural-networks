import * as d3 from "d3";
import * as config from "./config";

import image1 from "../cat_conv/cat_conv1.png";
import image2 from "../cat_conv/cat_conv3.png";
import image3 from "../cat_conv/cat_conv5.png";

import puppy from "../Images/dog.png";
import puppySobel from "../Images/puppySobel.png";
import puppySobelConv from "../Images/puppySobelConv.png";
import puppyOutput from "../Images/puppyOutput.png";

/**
 * State of the visualization. Number of layers
 */
let numLayers = 0;

/**
 * Proportions of the SVG
 */
let svgWidth = 900;
let svgHeight = svgWidth / 3;

/**
 * Proportions for image
 */
let imageSectionWidth = svgWidth;
let imageSectionHeight = svgHeight / 2;

let imageSectionX = 0;
let imageSectionY = 0;

let groupWidth = 0.2 * imageSectionWidth;
let groupHeight = 0.5 * imageSectionHeight;

// Image
let imageWidth = 0.4 * groupWidth;
let imageHeight = imageWidth;

let imageX = 0.6 * groupWidth;
let imageY = 0.2 * groupHeight;

// Image Text
let imageTextX = imageX + imageWidth / 2;
let imageTextY = imageY - 0.1 * imageHeight;

// Arrow
let arrowLength = 0.35 * groupWidth;
let arrowX1 = 0.1 * groupWidth;
let arrowX2 = arrowX1 + arrowLength;
let arrowY = 0.7 * groupHeight;

// Arrow Text
let arrowTextX = arrowX1 + arrowLength / 2;
let arrowTextY = arrowY - 0.1 * groupHeight;

// Start Image
let startImageX = 0.15 * imageSectionWidth;
let startImageY = imageSectionY + (0.3 * imageSectionHeight) + imageY;

/**
 * Proportions of the description text
 */
let textSectionWidth = svgWidth;
let textSectionHeight = svgHeight / 4;

let textSectionX = 0;
let textSectionY = svgHeight / 2;

let textX = textSectionX + textSectionWidth / 2;
let textY = textSectionY + textSectionHeight / 2;

/**
 * Proportions of the buttons
 */
let buttonSectionWidth = svgWidth;
let buttonSectionHeight = textSectionHeight;

let buttonSectionX = 0;
let buttonSectionY = (3 / 4) * svgHeight;

let buttonWidth = buttonSectionWidth / 8;
let buttonHeight = buttonSectionHeight / 2;

let nextButtonX = buttonSectionX + buttonSectionWidth / 2;
let nextButtonY = buttonSectionY + buttonSectionHeight / 3;

let prevButtonX = nextButtonX - buttonWidth;
let prevButtonY = nextButtonY;

/**
 * Font Size
 */
let fontSize = svgWidth / 30;

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
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
    let arrowSize = 0.04 * groupHeight;
    let arrowPoints = [[0, 0], [0, arrowSize * 2], [arrowSize * 3, arrowSize]];

    // arrow
    d3.select("#multiConvSvg").append("svg:defs").append("svg:marker")
        .attr("id", "triangle")
        .attr("refX", 0)
        .attr("refY", arrowSize)
        .attr("markerWidth", groupHeight / 5)
        .attr("markerHeight", groupHeight / 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", d3.line()(arrowPoints))
        .style("stroke", "black");
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
        .attr("transform", (_, i) => `translate(${imageWidth + startImageX + (groupWidth * i)}, ${imageSectionY + (0.3 * imageSectionHeight)})`)
        .attr("opacity", 0.5)
        .classed("convLayerWrapper", true);
    
    //line              
    convLayerWrappers.append("line")
        .attr("x1", arrowX1)
        .attr("y1", arrowY)
        .attr("x2", arrowX2)
        .attr("y2", arrowY)          
        .attr("stroke-width", fontSize / 30)
        .attr("stroke", "black")
        .attr("marker-end", "url(#triangle)")
        .classed("layerArrow", true);

    //text
    convLayerWrappers.append("text")
        .attr("x", arrowTextX)
        .attr("y", arrowTextY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 3)
        .attr("pointer-events", "none")
        .text("Convolution");

    //image
    convLayerWrappers.append("svg:image")
        .attr("x", imageX)
        .attr("y", imageY)
        .attr("width", imageWidth)
        .attr("height", imageHeight)
        .attr("stroke", "black")
        .attr("image-rendering", "pixelated")
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

    //text
    convLayerWrappers.append("text")
        .attr("x", imageTextX)
        .attr("y", imageTextY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 3)
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
    
    // This is the Add Layer Button
    const addButtonWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "addButtonWrapper");
    addButtonWrapper.append("rect")
        .attr("x", nextButtonX)
        .attr("y", nextButtonY)
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("fill", config.nextColor)
        .style("cursor", "pointer")
        .on("click", () => updateState(actions.ADD))
        .classed("buttonRect", true);
    addButtonWrapper.append("text")
        .attr("x", nextButtonX + buttonWidth / 2)
        .attr("y", nextButtonY + buttonHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text("Next")
        .classed("buttonText", true);

    // This is the Remove Layer Button
    const removeButtonWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "removeButtonWrapper")
        .attr("visibility", "hidden");
    removeButtonWrapper.append("rect")
        .attr("x", prevButtonX)
        .attr("y", prevButtonY)
        .attr("width", buttonWidth)
        .attr("height", buttonHeight)
        .attr("fill", config.prevColor)
        .style("cursor", "pointer")
        .on("click", () => updateState(actions.REMOVE))
        .classed("buttonRect", true);
    removeButtonWrapper.append("text")
        .attr("x", prevButtonX + buttonWidth / 2)
        .attr("y", prevButtonY + buttonHeight / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .text("Prev")
        .classed("buttonText", true);
}

/**
 * Draws the image and text
 */
export function drawInputImage() {
    
    const imageWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "imageWrapper");
    imageWrapper.append("svg:image")
        .attr("x", startImageX)
        .attr("y", startImageY)
        .attr("width", imageWidth)
        .attr("height", imageHeight)
        .attr('xlink:href', puppy)
        .attr("stroke", "black");
    imageWrapper.append("text")
        .attr("x", startImageX + imageWidth / 2)
        .attr("y", startImageY - 0.1 * imageHeight)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 3)
        .attr("pointer-events", "none")
        .text("Input");
    
}

/**
 * Draws the text
 */
export function drawText() {
    
    const imageWrapper = d3.select("#multiConvSvg")
        .append("g")
        .attr("id", "textWrapper");
    imageWrapper.append("text")
        .attr("x", textX)
        .attr("y", textY)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("font-family", "sans-serif")
        .attr("font-size", fontSize / 2)
        .attr("pointer-events", "none")
        .attr("dy", "0em")
        .text("Here is the puppy image.")
        .classed("descriptionText", true);
    imageWrapper.append("text")
        .attr("x", textX)
        .attr("y", textY)
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
        txt = "Certain features of the puppy are being highlighted.";
        txt2 = "Let's apply another convolution!";
    } else if (numLayers == 2) {
        txt = "The eyes seem to have a lot more prominence with a";
        txt2 = "little bit of noise around the feet. Let's apply another convolution!";
    } else if (numLayers == 3) {
        txt = "The region most prominent corresponds to the eyes of the puppy.";
        txt2 = "Our network seems to be searching for these kinds of features...";
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