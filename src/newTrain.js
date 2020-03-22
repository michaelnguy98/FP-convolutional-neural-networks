import * as d3 from "d3";

import * as config from "./config";

export function initUserTrainSection() {
    recalculate();
    initSVG();
    drawFrame();
}

let svgWidth;
let svgHeight;

let inputLayerHeight;
let conv1LayerHeight;
let conv2LayerHeight;
let outputLayerHeight;

let layerOffset;
let gapSize;

/**
 * Return all of the entries with one index smaller than the given indexCutoff.
 * Filtering arr=[[1,2,3]  with indexCutoff=1 will return [1,2,3,4,7].
 *                [4,5,6]
 *                [7,8,9]]
 * 
 * @param {any[][]} arr 
 * @param {Int} indexCutoff 
 */
function filter2d(arr, indexCutoff) {
    const output = Array(arr.length * arr[0].length - (arr.length - indexCutoff) * (arr[0].length - indexCutoff));
    let k = 0;
    for (let i = 0; i < indexCutoff; ++i) {
        for (let j = 0; j < arr[i].length; ++j) {
            output[k] = arr[i][j];
            ++k;
        }
    }
    for (let i = indexCutoff; i < arr.length; ++i) {
        for (let j = 0; j < indexCutoff; ++j) {
            output[k] = arr[i][j];
            ++k;
        }
    }
    return output;
}

function getFilteredCol(width, indexCutoff, index) {
    if (index < width * indexCutoff) {
        return index % width;
    } else {
        return (index - (width * indexCutoff)) % indexCutoff;
    }
}
function getFilteredRow(width, indexCutoff, index) {
    if (index < width * indexCutoff) {
        return Math.floor(index / width);
    } else {
        return Math.floor((index - (width * indexCutoff)) / indexCutoff) + indexCutoff;
    }
}

let data = {
    input: [
        Array(32).fill().map((a, i) => Array(32).fill().map((b, j) => (i + j) * 8)),
        Array(32).fill().map((a, i) => Array(32).fill().map((b, j) => (i + j) * 6)),
        Array(32).fill().map((a, i) => Array(32).fill().map((b, j) => (i + j) * 4)),
    ],
    conv1: [
        Array(16).fill().map(() => Array(16).fill(0)),
        Array(16).fill().map(() => Array(16).fill(0)),
        Array(16).fill().map(() => Array(16).fill(0)),
        Array(16).fill().map(() => Array(16).fill(0)),
    ],
    conv2: [
        Array(8).fill().map(() => Array(8).fill(0)),
        Array(8).fill().map(() => Array(8).fill(0)),
        Array(8).fill().map(() => Array(8).fill(0)),
        Array(8).fill().map(() => Array(8).fill(0)),
        Array(8).fill().map(() => Array(8).fill(0)),
        Array(8).fill().map(() => Array(8).fill(0)),
        Array(8).fill().map(() => Array(8).fill(0)),
        Array(8).fill().map(() => Array(8).fill(0)),
    ],
    output: Array(10).fill(0)
}

const renderCutoffs = {
    input: 5,
    conv1: 4,
    conv2: 3
}

const skewAngle = 40;
const skewAngleRad = skewAngle * Math.PI / 180;

export function initSVG() {
    const root = d3.select("#newTrainSection")
        .append("svg")
        .attr("id", "newTrainSvg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
    const inputCellWidth = Math.cos(skewAngleRad) * inputLayerHeight / data.input[0][0].length;
    const inputCellHeight = inputLayerHeight / data.input[0][0].length;
    const inputLeftMargin = config.borderWidth;
    const inputUpperOffset = Math.tan(skewAngleRad) * inputCellWidth * data.input[0][0].length;
    const inputUpperMargin = config.borderWidth * 2+ inputUpperOffset;
    const inputLayers = root.append("g")
        .attr("id", "inputLayers")
        .attr("transform", `translate(${inputLeftMargin},
                                      ${inputUpperMargin})`);
    for (let i = 0; i < data.input.length; ++i) {
        //const filteredData = filter2d(data.input[i], renderCutoffs.input);

        const inputWrapper = inputLayers.append("g")
            .attr("id", `inputLayerWrapper-${i}`)
            .attr("transform", `translate(${layerOffset * i},
                                          ${0})
                                skewY(${skewAngle * -1})`);
        inputWrapper.selectAll(".cellColor")
            .data(data.input[i].flat())//filteredData)
            .enter()
            .append("rect")
            .attr("width", inputCellWidth)
            .attr("height", inputCellHeight)
            .attr("x", (_, j) => (j % data.input[i][0].length) * inputCellWidth)
            .attr("y", (_, j) => Math.floor(j / data.input[i][0].length) * inputCellHeight)
            .attr("fill", d => d3.rgb(d, d, d))
            .attr("stroke", config.borderColor)
            .attr("stroke-width", config.borderWidth)
            .classed("cellColor", true);
        const inputOutline = inputWrapper.append("rect")
            .attr("id", `inputOutline-${i}`)
            .attr("width", inputCellWidth * data.input[i][0].length)
            .attr("height", inputCellHeight * data.input[i].length)
            .attr("stroke", config.highlightColorIn)
            .attr("stroke-width", config.borderWidth * 2)
            .attr("pointer-events", "none")
            .attr("fill-opacity", 0);
    }

    const conv1CellWidth = Math.cos(skewAngleRad) * conv1LayerHeight / data.conv1[0][0].length;
    const conv1CellHeight = conv1LayerHeight / data.conv1[0][0].length;
    const conv1LeftMargin = inputLeftMargin + config.borderWidth * 2 + (inputCellWidth * data.input[0][0].length) + (layerOffset * (data.input.length - 1)) + gapSize;
    const conv1UpperOffset = Math.tan(skewAngleRad) * conv1CellWidth * data.conv1[0][0].length;
    const conv1UpperMargin = config.borderWidth * 2 + (inputLayerHeight + inputUpperOffset - conv1LayerHeight - conv1UpperOffset) / 2 + Math.tan(skewAngleRad) * conv1CellWidth * data.conv1[0][0].length;
    const conv1Layers = root.append("g")
        .attr("id", "conv1Layers")
        .attr("transform", `translate(${conv1LeftMargin},
                                      ${conv1UpperMargin})`);
    for (let i = 0; i < data.conv1.length; ++i) {
        const conv1Wrapper = conv1Layers.append("g")
            .attr("id", `conv1LayerWrapper-${i}`)
            .attr("transform", `translate(${layerOffset * i},
                                          ${0})
                                skewY(${skewAngle * -1})`);
        conv1Wrapper.selectAll(".cellColor")
            .data(data.conv1[i].flat())
            .enter()
            .append("rect")
            .attr("width", conv1CellWidth)
            .attr("height", conv1CellHeight)
            .attr("x", (_, j) => (j % data.conv1[i][0].length) * conv1CellWidth)
            .attr("y", (_, j) => Math.floor(j / data.conv1[i][0].length) * conv1CellHeight)
            .attr("fill", "pink")
            .attr("stroke", config.borderColor)
            .attr("stroke-width", config.borderWidth)
            .classed("cellColor", true);
        const conv1Outline = conv1Wrapper.append("rect")
            .attr("id", `conv1Outline-${i}`)
            .attr("width", conv1CellWidth * data.conv1[i][0].length)
            .attr("height", conv1CellHeight * data.conv1[i].length)
            .attr("stroke", config.highlightColorIn)
            .attr("stroke-width", config.borderWidth * 2)
            .attr("pointer-events", "none")
            .attr("fill-opacity", 0);
    }

    const conv2CellWidth = Math.cos(skewAngleRad) * conv2LayerHeight / data.conv2[0][0].length;
    const conv2CellHeight = conv2LayerHeight / data.conv2[0][0].length;
    const conv2LeftMargin = conv1LeftMargin + config.borderWidth * 2 + (conv1CellWidth * data.conv1[0][0].length) + (layerOffset * (data.conv1.length - 1)) + gapSize;
    const conv2UpperOffset = Math.tan(skewAngleRad) * conv2CellWidth * data.conv2[0][0].length;
    const conv2UpperMargin = config.borderWidth * 2 + (inputLayerHeight + inputUpperOffset - conv2LayerHeight - conv2UpperOffset) / 2 + Math.tan(skewAngleRad) * conv2CellWidth * data.conv2[0][0].length;
    const conv2Layers = root.append("g")
        .attr("id", "conv2Layers")
        .attr("transform", `translate(${conv2LeftMargin},
                                      ${conv2UpperMargin})`);
    for (let i = 0; i < data.conv2.length; ++i) {
        const conv2Wrapper = conv2Layers.append("g")
            .attr("id", `conv2LayerWrapper-${i}`)
            .attr("transform", `translate(${layerOffset * i},
                                          ${0})
                                skewY(${skewAngle * -1})`);
        conv2Wrapper.selectAll(".cellColor")
            .data(data.conv2[i].flat())
            .enter()
            .append("rect")
            .attr("width", conv2CellWidth)
            .attr("height", conv2CellHeight)
            .attr("x", (_, j) => (j % data.conv2[i][0].length) * conv2CellWidth)
            .attr("y", (_, j) => Math.floor(j / data.conv2[i][0].length) * conv2CellHeight)
            .attr("fill", "pink")
            .attr("stroke", config.borderColor)
            .attr("stroke-width", config.borderWidth)
            .classed("cellColor", true);
        const conv2Outline = conv2Wrapper.append("rect")
            .attr("id", `conv2Outline-${i}`)
            .attr("width", conv2CellWidth * data.conv2[i][0].length)
            .attr("height", conv2CellHeight * data.conv2[i].length)
            .attr("stroke", config.highlightColorIn)
            .attr("stroke-width", config.borderWidth * 2)
            .attr("pointer-events", "none")
            .attr("fill-opacity", 0);
    }

    const outputCellWidth = outputLayerHeight / data.output.length;
    const outputCellHeight = outputLayerHeight / data.output.length;
    const outputLeftMargin = conv2LeftMargin + config.borderWidth * 2 + (conv2CellWidth * data.conv2[0][0].length) + (layerOffset * (data.conv2.length - 1)) + gapSize;
    const outputUpperMargin = config.borderWidth + (inputLayerHeight + inputUpperOffset - outputLayerHeight) / 2;
    const outputWrapper = root.append("g")
        .attr("id", "outputWrapper")
        .attr("transform", `translate(${outputLeftMargin},
                                      ${outputUpperMargin})`);
    outputWrapper.selectAll(".cellColor")
        .data(data.output.flat())
        .enter()
        .append("rect")
        .attr("width", outputCellWidth)
        .attr("height", outputCellHeight)
        .attr("x", 0)
        .attr("y", (_, j) => j * outputCellHeight)
        .attr("fill", "pink")
        .attr("stroke", config.borderColor)
        .attr("stroke-width", config.borderWidth)
        .classed("cellColor", true);
    const outputOutline = outputWrapper.append("rect")
        .attr("id", 'outputOutline')
        .attr("width", outputCellWidth)
        .attr("height", outputCellHeight * data.output.length)
        .attr("stroke", config.highlightColorIn)
        .attr("stroke-width", config.borderWidth * 2)
        .attr("pointer-events", "none")
        .attr("fill-opacity", 0);
}

function drawFrame() {

}

function recalculate() {
    svgWidth = config.svgWidth;
    //svgWidth = 765;
    //inputLayerHeight = 200;
    //layerOffset = 20;
    //gapSize = 50;

    inputLayerHeight = svgWidth * 0.261438;
    conv1LayerHeight = inputLayerHeight * 0.75;
    conv2LayerHeight = inputLayerHeight * 0.5;
    outputLayerHeight = inputLayerHeight * 1.1;

    layerOffset = inputLayerHeight * 0.1;
    gapSize = inputLayerHeight * 0.25;

    //const inputLayerWidth = Math.cos(skewAngleRad) * inputLayerHeight + (layerOffset * (data.input.length - 1));
    //const conv1LayerWidth = Math.cos(skewAngleRad) * conv1LayerHeight + (layerOffset * (data.conv1.length - 1));
    //const conv2LayerWidth = Math.cos(skewAngleRad) * conv2LayerHeight + (layerOffset * (data.conv2.length - 1));
    //const outputLayerWidth = outputLayerHeight / data.output.length;
    //const total = inputLayerWidth + conv1LayerWidth + conv2LayerWidth + outputLayerWidth + gapSize * 3 + config.borderWidth * 4;

    svgHeight = inputLayerHeight + Math.sin(skewAngleRad) * inputLayerHeight + config.borderWidth * 4;
}

export function resizeUserTrain() {
    recalculate();
    
    const root = d3.select("#newTrainSection")
        .select("#newTrainSvg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
    const inputCellWidth = Math.cos(skewAngleRad) * inputLayerHeight / data.input[0][0].length;
    const inputCellHeight = inputLayerHeight / data.input[0][0].length;
    const inputLeftMargin = config.borderWidth;
    const inputUpperOffset = Math.tan(skewAngleRad) * inputCellWidth * data.input[0][0].length;
    const inputUpperMargin = config.borderWidth * 2 + inputUpperOffset;
    const inputLayers = root.select("#inputLayers")
        .attr("transform", `translate(${inputLeftMargin},
                                      ${inputUpperMargin})`);
    for (let i = 0; i < data.input.length; ++i) {
        const inputWrapper = inputLayers.selectAll(`#inputLayerWrapper-${i}`)
            .attr("transform", `translate(${layerOffset * i},
                                          ${0})
                                skewY(${skewAngle * -1})`);
        inputWrapper.selectAll(".cellColor")
            .attr("width", inputCellWidth)
            .attr("height", inputCellHeight)
            .attr("x", (_, j) => (j % data.input[i][0].length) * inputCellWidth)
            .attr("y", (_, j) => Math.floor(j / data.input[i][0].length) * inputCellHeight);
        inputWrapper.select(`#inputOutline-${i}`)
            .attr("width", inputCellWidth * data.input[i][0].length)
            .attr("height", inputCellHeight * data.input[i].length);
    }

    const conv1CellWidth = Math.cos(skewAngleRad) * conv1LayerHeight / data.conv1[0][0].length;
    const conv1CellHeight = conv1LayerHeight / data.conv1[0][0].length;
    const conv1LeftMargin = inputLeftMargin + config.borderWidth * 2 + (inputCellWidth * data.input[0][0].length) + (layerOffset * (data.input.length - 1)) + gapSize;
    const conv1UpperOffset = Math.tan(skewAngleRad) * conv1CellWidth * data.conv1[0][0].length;
    const conv1UpperMargin = config.borderWidth * 2 + (inputLayerHeight + inputUpperOffset - conv1LayerHeight - conv1UpperOffset) / 2 + Math.tan(skewAngleRad) * conv1CellWidth * data.conv1[0][0].length;
    const conv1Layers = root.select("#conv1Layers")
        .attr("transform", `translate(${conv1LeftMargin},
                                      ${conv1UpperMargin})`);
    for (let i = 0; i < data.conv1.length; ++i) {
        const conv1Wrapper = conv1Layers.select(`#conv1LayerWrapper-${i}`)
            .attr("transform", `translate(${layerOffset * i},
                                          ${0})
                                skewY(${skewAngle * -1})`);
        conv1Wrapper.selectAll(".cellColor")
            .attr("width", conv1CellWidth)
            .attr("height", conv1CellHeight)
            .attr("x", (_, j) => (j % data.conv1[i][0].length) * conv1CellWidth)
            .attr("y", (_, j) => Math.floor(j / data.conv1[i][0].length) * conv1CellHeight);
        conv1Wrapper.select(`#conv1Outline-${i}`)
            .attr("width", conv1CellWidth * data.conv1[i][0].length)
            .attr("height", conv1CellHeight * data.conv1[i].length);
    }

    const conv2CellWidth = Math.cos(skewAngleRad) * conv2LayerHeight / data.conv2[0][0].length;
    const conv2CellHeight = conv2LayerHeight / data.conv2[0][0].length;
    const conv2LeftMargin = conv1LeftMargin + config.borderWidth * 2 + (conv1CellWidth * data.conv1[0][0].length) + (layerOffset * (data.conv1.length - 1)) + gapSize;
    const conv2UpperOffset = Math.tan(skewAngleRad) * conv2CellWidth * data.conv2[0][0].length;
    const conv2UpperMargin = config.borderWidth * 2 + (inputLayerHeight + inputUpperOffset - conv2LayerHeight - conv2UpperOffset) / 2 + Math.tan(skewAngleRad) * conv2CellWidth * data.conv2[0][0].length;
    const conv2Layers = root.select("#conv2Layers")
        .attr("transform", `translate(${conv2LeftMargin},
                                      ${conv2UpperMargin})`);
    for (let i = 0; i < data.conv2.length; ++i) {
        const conv2Wrapper = conv2Layers.select(`#conv2LayerWrapper-${i}`)
            .attr("transform", `translate(${layerOffset * i},
                                          ${0})
                                skewY(${skewAngle * -1})`);
        conv2Wrapper.selectAll(".cellColor")
            .attr("width", conv2CellWidth)
            .attr("height", conv2CellHeight)
            .attr("x", (_, j) => (j % data.conv2[i][0].length) * conv2CellWidth)
            .attr("y", (_, j) => Math.floor(j / data.conv2[i][0].length) * conv2CellHeight);
        conv2Wrapper.select(`#conv2Outline-${i}`)
            .attr("width", conv2CellWidth * data.conv2[i][0].length)
            .attr("height", conv2CellHeight * data.conv2[i].length);
    }

    const outputCellWidth = outputLayerHeight / data.output.length;
    const outputCellHeight = outputLayerHeight / data.output.length;
    const outputLeftMargin = conv2LeftMargin + config.borderWidth * 2+ (conv2CellWidth * data.conv2[0][0].length) + (layerOffset * (data.conv2.length - 1)) + gapSize;
    const outputUpperMargin = config.borderWidth + (inputLayerHeight + inputUpperOffset - outputLayerHeight) / 2;
    const outputWrapper = root.select("#outputWrapper")
        .attr("transform", `translate(${outputLeftMargin},
                                      ${outputUpperMargin})`);
    outputWrapper.selectAll(".cellColor")
        .attr("width", outputCellWidth)
        .attr("height", outputCellHeight)
        .attr("x", 0)
        .attr("y", (_, j) => j * outputCellHeight);
    outputWrapper.select("#outputOutline")
        .attr("width", outputCellWidth)
        .attr("height", outputCellHeight * data.output.length);
}
