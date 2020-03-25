import * as d3 from "d3";
import * as tf from '@tensorflow/tfjs';

import * as config from "./config";

export function initUserTrainSection() {
    loadModel().then(modelData => {
        loadImage().then((imageData) => {
            [model, weights] = modelData;
            weightsScalingFactors = initScalingFactors(weights);
            updateScalingState();

            inputImg = imageData;

            prediction = makePrediction();

            initSVG();
            resizeUserTrain();
            drawFrame();
        });
    });

    initSlider();
}

const MODEL_URL = "https://raw.githubusercontent.com/UW-CSE442-WI20/FP-convolutional-neural-networks/mjh/src/trainedVGG/model.json";
const IMG_URL = "https://raw.githubusercontent.com/UW-CSE442-WI20/FP-convolutional-neural-networks/mjh/Images/dog.png";

function loadImage() {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(tf.browser.fromPixels(image).asType("float32").div(255).expandDims(0));
        image.onerror = reject;
        image.crossOrigin = "Anonymous";
        image.src = IMG_URL;
    });
}
async function loadModel() {
    const loadedModel = await tf.loadLayersModel(MODEL_URL);

    const layerOutputs = Array(NUM_LAYERS);
    const layerWeights = Array(NUM_LAYERS);
    for (let i = 0; i < NUM_LAYERS; ++i) {
        if (i == NUM_LAYERS - 1) {
            layerOutputs[i] = loadedModel.getLayer(`dense_${NUM_LAYERS - NUM_CONV_LAYERS}`).output;
        } else {
            layerOutputs[i] = loadedModel.getLayer(`activation_${i + 1}`).output;
        }

        if (i < NUM_CONV_LAYERS) {
            layerWeights[i] = loadedModel.getLayer(`conv2d_${i + 1}`).getWeights().map(v => v.clone());
        } else {
            layerWeights[i] = loadedModel.getLayer(`dense_${i - NUM_CONV_LAYERS + 1}`).getWeights().map(v => v.clone());
        }
    }

    const allOutputsModel = tf.model({inputs: loadedModel.inputs, outputs: layerOutputs}); 
    return [allOutputsModel, layerWeights];
}
function initScalingFactors(weights) {
    const factors = Array(weights.length);
    for (let i = 0; i < weights.length; ++i) {
        factors[i] = Array(weights[i].length);
        for (let j = 0; j < weights[i].length; ++j) {
            factors[i][j] = tf.randomUniform(weights[i][j].shape, -1, 1, "float32", 1234554321)
        }
    }
    return factors;
}
function updateScalingState() {
    const curValue = d3.select("#newTrainSection").select("#trainSlider").node().value;
    weightsScalingState = ((curValue / SLIDER_NUM_TICKS) - 0.5) * WEIGHTS_MAX_SCALE;
}
function makePrediction() {
    function getPrediction() {
        for (let i = 0; i < NUM_LAYERS; ++i) {
            const newWeights = Array(weights[i].length);
            for (let j = 0; j < weights[i].length; ++j) {
                newWeights[j] = tf.add(weights[i][j], tf.mul(weightsScalingFactors[i][j], weightsScalingState));
            }

            if (i < NUM_CONV_LAYERS) {
                model.getLayer(`conv2d_${i + 1}`).setWeights(newWeights);
            } else {
                model.getLayer(`dense_${i - NUM_CONV_LAYERS + 1}`).setWeights(newWeights);
            }
        }
        return model.predict(inputImg);
    }
    return tf.tidy(getPrediction);
}

let svgWidth;
let svgHeight;

let inputLayerHeight;
let conv1LayerHeight;
let conv2LayerHeight;
let outputLayerHeight;

let layerOffset;
let gapSize;

let strokeSize = 0;
let outlineSize;

/**
 * Return all of the entries with one index smaller than the given indexCutoff.
 * Filtering arr=[[1,2,3]  with indexCutoff=1 will return [1,2,3,4,7].
 *                [4,5,6]
 *                [7,8,9]]
 * 
 * @param {any[][]} arr 
 * @param {Int} indexCutoff 
 */
function filter2d(arr, channelIndex, indexCutoff) {
    const output = Array(arr.length * arr[0].length - (arr.length - indexCutoff) * (arr[0].length - indexCutoff));
    let k = 0;
    for (let i = 0; i < indexCutoff; ++i) {
        for (let j = 0; j < arr[i].length; ++j) {
            output[k] = arr[i][j][channelIndex];
            ++k;
        }
    }
    for (let i = indexCutoff; i < arr.length; ++i) {
        for (let j = 0; j < indexCutoff; ++j) {
            output[k] = arr[i][j][channelIndex];
            ++k;
        }
    }
    return output;
}
function flatImage(arr, channelIndex) {
    const output = Array(arr.length * arr[0].length);
    for (let i = 0; i < arr.length; ++i) {
        for (let j = 0; j < arr[i].length; ++j) {
            output[i * arr[i].length + j] = arr[i][j][channelIndex];
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

let innerLayerDisplay = {
    input: [
        {
            filterIndex: 0
        },
        {
            filterIndex: 1
        },
        {
            filterIndex: 2
        },
    ],
    conv1: [
        {
            layerIndex: 3,
            filterIndex: 124,
        },
        {
            layerIndex: 3,
            filterIndex: 121,
        },
        {
            layerIndex: 2,
            filterIndex: 2,
        },
        {
            layerIndex: 2,
            filterIndex: 15,
        },
    ],
    conv2: [
        {
            layerIndex: 4,
            filterIndex: 22,
        },
        {
            layerIndex: 4,
            filterIndex: 26,
        },
        {
            layerIndex: 4,
            filterIndex: 42,
        },
        {
            layerIndex: 5,
            filterIndex: 15,
        },
        {
            layerIndex: 5,
            filterIndex: 24,
        },
        {
            layerIndex: 5,
            filterIndex: 87,
        },
        {
            layerIndex: 6,
            filterIndex: 28,
        },
        {
            layerIndex: 6,
            filterIndex: 124,
        },
    ],
}

const renderCutoffs = {
    input: 5,
    conv1: 4,
    conv2: 3
}

const SLIDER_NUM_TICKS = 100;
const WEIGHTS_MAX_SCALE = 0.1;

const NUM_LAYERS = 15;
const NUM_CONV_LAYERS = 13;

let inputImg;
let model;
let weights;
let weightsScalingFactors;
let weightsScalingState;
let prediction;

const imageOversizing = 1.1;

const skewAngle = 40;
const skewAngleRad = skewAngle * Math.PI / 180;

function initSVG() {
    const root = d3.select("#newTrainSection")
        .append("svg")
        .attr("id", "newTrainSvg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
    const inputData = inputImg.arraySync()[0];
    const inputLayers = root.append("g")
        .attr("id", "inputLayers");
    for (let i = 0; i < innerLayerDisplay.input.length; ++i) {
        let vals;
        if (i < innerLayerDisplay.input.length - 1) {
            vals = filter2d(inputData, innerLayerDisplay.input[i].filterIndex, renderCutoffs.input);
        } else {
            vals = flatImage(inputData, innerLayerDisplay.input[1].filterIndex);
        }

        const inputWrapper = inputLayers.append("g")
            .attr("id", `inputLayerWrapper-${i}`);
        inputWrapper.selectAll(".cellColor")
            .data(vals)
            .enter()
            .append("rect")
            .attr("stroke", config.borderColor)
            .attr("stroke-width", strokeSize)
            .classed("cellColor", true);
        const inputOutline = inputWrapper.append("rect")
            .attr("id", `inputOutline-${i}`)
            .attr("stroke", config.highlightColorIn)
            .attr("stroke-width", outlineSize)
            .attr("pointer-events", "none")
            .attr("fill-opacity", 0);
    }

    const conv1Data = prediction[innerLayerDisplay.conv1[0].layerIndex].arraySync()[0];
    const conv1Layers = root.append("g")
        .attr("id", "conv1Layers");
    for (let i = 0; i < innerLayerDisplay.conv1.length; ++i) {
        let vals;
        if (i < innerLayerDisplay.conv1.length - 1) {
            vals = filter2d(conv1Data, i, renderCutoffs.conv1);
        } else {
            vals = flatImage(conv1Data, i);
        }

        const conv1Wrapper = conv1Layers.append("g")
            .attr("id", `conv1LayerWrapper-${i}`);
        conv1Wrapper.selectAll(".cellColor")
            .data(vals)
            .enter()
            .append("rect")
            .attr("stroke", config.borderColor)
            .attr("stroke-width", strokeSize)
            .classed("cellColor", true);
        const conv1Outline = conv1Wrapper.append("rect")
            .attr("id", `conv1Outline-${i}`)
            .attr("stroke", config.highlightColorIn)
            .attr("stroke-width", outlineSize)
            .attr("pointer-events", "none")
            .attr("fill-opacity", 0);
    }

    const conv2Data = prediction[innerLayerDisplay.conv2[0].layerIndex].arraySync()[0];
    const conv2Layers = root.append("g")
        .attr("id", "conv2Layers");
    for (let i = 0; i < innerLayerDisplay.conv2.length; ++i) {
        let vals;
        if (i < innerLayerDisplay.conv2.length - 1) {
            vals = filter2d(conv2Data, i, renderCutoffs.conv2);
        } else {
            vals = flatImage(conv2Data, i);
        }

        const conv2Wrapper = conv2Layers.append("g")
            .attr("id", `conv2LayerWrapper-${i}`);
        conv2Wrapper.selectAll(".cellColor")
            .data(vals)
            .enter()
            .append("rect")
            .attr("stroke", config.borderColor)
            .attr("stroke-width", strokeSize)
            .classed("cellColor", true);
        const conv2Outline = conv2Wrapper.append("rect")
            .attr("id", `conv2Outline-${i}`)
            .attr("stroke", config.highlightColorIn)
            .attr("stroke-width", outlineSize)
            .attr("pointer-events", "none")
            .attr("fill-opacity", 0);
    }

    const outputData = prediction[prediction.length - 1].arraySync()[0];
    const outputWrapper = root.append("g")
        .attr("id", "outputWrapper");
    outputWrapper.selectAll(".cellColor")
        .data(outputData)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("stroke", config.borderColor)
        .attr("stroke-width", outlineSize / 4)
        .classed("cellColor", true);
    const outputOutline = outputWrapper.append("rect")
        .attr("id", 'outputOutline')
        .attr("stroke", config.highlightColorIn)
        .attr("stroke-width", outlineSize)
        .attr("pointer-events", "none")
        .attr("fill-opacity", 0);
}

function initSlider() {
    const root = d3.select("#newTrainSection");

    const slider = root.append("div")
        .style("text-align", "center")
        .append("input")
        .attr("type", "range")
        .attr("id", "trainSlider")
        .style("width", "50%")
        .attr("min", 1)
        .attr("max", SLIDER_NUM_TICKS)
        .attr("value", SLIDER_NUM_TICKS / 2)
        .on("input", () => {
            updateScalingState();
            prediction = makePrediction();
            drawFrame();
        });
}

function drawFrame() {
    const root = d3.select("#newTrainSvg");

    const inputData = inputImg.arraySync()[0];
    const inputLayers = root.select("#inputLayers");
    for (let i = 0; i < innerLayerDisplay.input.length; ++i) {
        let vals;
        if (i < innerLayerDisplay.input.length - 1) {
            vals = filter2d(inputData, innerLayerDisplay.input[i].filterIndex, renderCutoffs.input);
        } else {
            vals = flatImage(inputData, innerLayerDisplay.input[1].filterIndex);
        }

        const inputWrapper = inputLayers.select(`#inputLayerWrapper-${i}`);
        inputWrapper.selectAll(".cellColor")
            .data(vals)
            .attr("fill", d => {
                if (i == 0) {
                    return d3.rgb(d * 255, 0, 0);
                } else if (i == 1) {
                    return d3.rgb(0, d * 255, 0);
                } else {
                    return d3.rgb(0, 0, d * 255);
                }
            });
    }

    const conv1Layers = root.select("#conv1Layers");
    for (let i = 0; i < innerLayerDisplay.conv1.length; ++i) {
        const conv1Data = prediction[innerLayerDisplay.conv1[i].layerIndex].arraySync()[0];
        let vals;
        if (i < innerLayerDisplay.conv1.length - 1) {
            vals = filter2d(conv1Data, innerLayerDisplay.conv1[i].filterIndex, renderCutoffs.conv1);
        } else {
            vals = flatImage(conv1Data, innerLayerDisplay.conv1[i].filterIndex);
        }

        const conv1Wrapper = conv1Layers.select(`#conv1LayerWrapper-${i}`);
        conv1Wrapper.selectAll(".cellColor")
            .data(vals)
            .attr("fill", d => d3.rgb(d * 255, d * 255, d * 255));
    }

    const conv2Layers = root.select("#conv2Layers");
    for (let i = 0; i < innerLayerDisplay.conv2.length; ++i) {
        const conv2Data = prediction[innerLayerDisplay.conv2[i].layerIndex].arraySync()[0];
        let vals;
        if (i < innerLayerDisplay.conv2.length - 1) {
            vals = filter2d(conv2Data, innerLayerDisplay.conv2[i].filterIndex, renderCutoffs.conv2);
        } else {
            vals = flatImage(conv2Data, innerLayerDisplay.conv2[i].filterIndex);
        }

        const conv2Wrapper = conv2Layers.select(`#conv2LayerWrapper-${i}`);
        conv2Wrapper.selectAll(".cellColor")
            .data(vals)
            .attr("fill", d => d3.rgb(d * 255, d * 255, d * 255));
    }

    const outputData = prediction[14].arraySync()[0];
    const maxVal = Math.max(...outputData);
    const outputWrapper = root.select("#outputWrapper");
    outputWrapper.selectAll(".cellColor")
        .data(outputData.flat())
        .attr("fill", d => {
            if (maxVal > 0) {
                return d3.rgb(d / maxVal * 255, d / maxVal * 255, d / maxVal * 255);
            } else {
                return d3.rgb(0, 0, 0);
            }
        });
}

function recalculate() {
    svgWidth = config.svgWidth;

    inputLayerHeight = svgWidth * 0.260;
    conv1LayerHeight = inputLayerHeight * 0.75;
    conv2LayerHeight = inputLayerHeight * 0.5;
    outputLayerHeight = inputLayerHeight * 1.1;

    layerOffset = inputLayerHeight * 0.1;
    gapSize = inputLayerHeight * 0.25;

    outlineSize = inputLayerHeight * 0.015;

    svgHeight = inputLayerHeight + Math.sin(skewAngleRad) * inputLayerHeight + outlineSize * 2;
}

export function resizeUserTrain() {
    recalculate();
    
    const root = d3.select("#newTrainSection")
        .select("#newTrainSvg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);
    
    const inputData = inputImg.arraySync()[0];
    const inputCellWidth = Math.cos(skewAngleRad) * inputLayerHeight / inputData[0].length;
    const inputCellHeight = inputLayerHeight / inputData[0].length;
    const inputLeftMargin = outlineSize / 2;
    const inputUpperOffset = Math.tan(skewAngleRad) * inputCellWidth * inputData[0].length;
    const inputUpperMargin = outlineSize + inputUpperOffset;
    const inputLayers = root.select("#inputLayers")
        .attr("transform", `translate(${inputLeftMargin},
                                      ${inputUpperMargin})`);
    for (let i = 0; i < innerLayerDisplay.input.length; ++i) {
        const inputWrapper = inputLayers.selectAll(`#inputLayerWrapper-${i}`)
            .attr("transform", `translate(${layerOffset * i},
                                          ${0})
                                skewY(${skewAngle * -1})`);
        inputWrapper.selectAll(".cellColor")
            .attr("width", inputCellWidth)
            .attr("height", inputCellHeight)
            .attr("width", (_, j) => {
                if (i < innerLayerDisplay.input.length - 1) {
                    if (getFilteredCol(inputData[0].length, renderCutoffs.input, j) < inputData[0].length - 1) {
                        return inputCellWidth * imageOversizing;
                    } else {
                        return inputCellWidth;
                    }
                } else {
                    if (j % inputData[0].length < inputData[0].length - 1) {
                        return inputCellWidth * imageOversizing;
                    } else {
                        return inputCellWidth;
                    }
                }
            })
            .attr("height", (_, j) => {
                if (i < innerLayerDisplay.input.length - 1) {
                    if (getFilteredRow(inputData[0].length, renderCutoffs.input, j) < inputData.length - 1) {
                        return inputCellHeight * imageOversizing;
                    } else {
                        return inputCellHeight;
                    }
                } else {
                    if (j / inputData[0].length < inputData.length - 1) {
                        return inputCellHeight * imageOversizing;
                    } else {
                        return inputCellHeight;
                    }
                }
            })
            .attr("x", (_, j) => {
                if (i < innerLayerDisplay.input.length - 1) {
                    return getFilteredCol(inputData[0].length, renderCutoffs.input, j) * inputCellWidth;
                } else {
                    return (j % inputData[0].length) * inputCellWidth;
                }
            })
            .attr("y", (_, j) => {
                if (i < innerLayerDisplay.input.length - 1) {
                    return getFilteredRow(inputData[0].length, renderCutoffs.input, j) * inputCellHeight;
                } else {
                    return Math.floor(j / inputData[0].length) * inputCellHeight;
                }
            })
        inputWrapper.select(`#inputOutline-${i}`)
            .attr("width", inputCellWidth * inputData[0].length)
            .attr("height", inputCellHeight * inputData.length)
            .attr("stroke-width", outlineSize);
    }

    const conv1Data = prediction[innerLayerDisplay.conv1[0].layerIndex].arraySync()[0];
    const conv1CellWidth = Math.cos(skewAngleRad) * conv1LayerHeight / conv1Data[0].length;
    const conv1CellHeight = conv1LayerHeight / conv1Data[0].length;
    const conv1LeftMargin = inputLeftMargin + outlineSize + (inputCellWidth * inputData[0].length) + (layerOffset * (innerLayerDisplay.input.length - 1)) + gapSize;
    const conv1UpperOffset = Math.tan(skewAngleRad) * conv1CellWidth * conv1Data[0].length;
    const conv1UpperMargin = outlineSize + (inputLayerHeight + inputUpperOffset - conv1LayerHeight - conv1UpperOffset) / 2 + Math.tan(skewAngleRad) * conv1CellWidth * conv1Data[0].length;
    const conv1Layers = root.select("#conv1Layers")
        .attr("transform", `translate(${conv1LeftMargin},
                                      ${conv1UpperMargin})`);
    for (let i = 0; i < innerLayerDisplay.conv1.length; ++i) {
        const conv1Wrapper = conv1Layers.select(`#conv1LayerWrapper-${i}`)
            .attr("transform", `translate(${layerOffset * i},
                                          ${0})
                                skewY(${skewAngle * -1})`);
        conv1Wrapper.selectAll(".cellColor")
            .attr("width", (_, j) => {
                if (i < innerLayerDisplay.conv1.length - 1) {
                    if (getFilteredCol(conv1Data[0].length, renderCutoffs.conv1, j) < conv1Data[0].length - 1) {
                        return conv1CellWidth * imageOversizing;
                    } else {
                        return conv1CellWidth;
                    }
                } else {
                    if (j % conv1Data[0].length < conv1Data[0].length - 1) {
                        return conv1CellWidth * imageOversizing;
                    } else {
                        return conv1CellWidth;
                    }
                }
            })
            .attr("height", (_, j) => {
                if (i < innerLayerDisplay.conv1.length - 1) {
                    if (getFilteredRow(conv1Data[0].length, renderCutoffs.conv1, j) < conv1Data.length - 1) {
                        return conv1CellHeight * imageOversizing;
                    } else {
                        return conv1CellHeight;
                    }
                } else {
                    if (j / conv1Data[0].length < conv1Data.length - 1) {
                        return conv1CellHeight * imageOversizing;
                    } else {
                        return conv1CellHeight;
                    }
                }
            })
            .attr("x", (_, j) => {
                if (i < innerLayerDisplay.conv1.length - 1) {
                    return getFilteredCol(conv1Data[0].length, renderCutoffs.conv1, j) * conv1CellWidth;
                } else {
                    return (j % conv1Data[0].length) * conv1CellWidth;
                }
            })
            .attr("y", (_, j) => {
                if (i < innerLayerDisplay.conv1.length - 1) {
                    return getFilteredRow(conv1Data[0].length, renderCutoffs.conv1, j) * conv1CellHeight;
                } else {
                    return Math.floor(j / conv1Data[0].length) * conv1CellHeight;
                }
            })
        conv1Wrapper.select(`#conv1Outline-${i}`)
            .attr("width", conv1CellWidth * conv1Data[0].length)
            .attr("height", conv1CellHeight * conv1Data.length)
            .attr("stroke-width", outlineSize);
    }

    const conv2Data = prediction[innerLayerDisplay.conv2[0].layerIndex].arraySync()[0];
    const conv2CellWidth = Math.cos(skewAngleRad) * conv2LayerHeight / conv2Data[0].length;
    const conv2CellHeight = conv2LayerHeight / conv2Data[0].length;
    const conv2LeftMargin = conv1LeftMargin + outlineSize + (conv1CellWidth * conv1Data[0].length) + (layerOffset * (innerLayerDisplay.conv1.length - 1)) + gapSize;
    const conv2UpperOffset = Math.tan(skewAngleRad) * conv2CellWidth * conv2Data[0].length;
    const conv2UpperMargin = outlineSize + (inputLayerHeight + inputUpperOffset - conv2LayerHeight - conv2UpperOffset) / 2 + Math.tan(skewAngleRad) * conv2CellWidth * conv2Data[0].length;
    const conv2Layers = root.select("#conv2Layers")
        .attr("transform", `translate(${conv2LeftMargin},
                                      ${conv2UpperMargin})`);
    for (let i = 0; i < innerLayerDisplay.conv2.length; ++i) {
        const conv2Wrapper = conv2Layers.select(`#conv2LayerWrapper-${i}`)
            .attr("transform", `translate(${layerOffset * i},
                                          ${0})
                                skewY(${skewAngle * -1})`);
        conv2Wrapper.selectAll(".cellColor")
            .attr("width", (_, j) => {
                if (i < innerLayerDisplay.conv2.length - 1) {
                    if (getFilteredCol(conv2Data[0].length, renderCutoffs.conv2, j) < conv2Data[0].length - 1) {
                        return conv2CellWidth * imageOversizing;
                    } else {
                        return conv2CellWidth;
                    }
                } else {
                    if (j % conv2Data[0].length < conv2Data[0].length - 1) {
                        return conv2CellWidth * imageOversizing;
                    } else {
                        return conv2CellWidth;
                    }
                }
            })
            .attr("height", (_, j) => {
                if (i < innerLayerDisplay.conv2.length - 1) {
                    if (getFilteredRow(conv2Data[0].length, renderCutoffs.conv2, j) < conv2Data.length - 1) {
                        return conv2CellHeight * imageOversizing;
                    } else {
                        return conv2CellHeight;
                    }
                } else {
                    if (j / conv2Data[0].length < conv2Data.length - 1) {
                        return conv2CellHeight * imageOversizing;
                    } else {
                        return conv2CellHeight;
                    }
                }
            })
            .attr("x", (_, j) => {
                if (i < innerLayerDisplay.conv2.length - 1) {
                    return getFilteredCol(conv2Data[0].length, renderCutoffs.conv2, j) * conv2CellWidth;
                } else {
                    return (j % conv2Data[0].length) * conv2CellWidth;
                }
            })
            .attr("y", (_, j) => {
                if (i < innerLayerDisplay.conv2.length - 1) {
                    return getFilteredRow(conv2Data[0].length, renderCutoffs.conv2, j) * conv2CellHeight;
                } else {
                    return Math.floor(j / conv2Data[0].length) * conv2CellHeight;
                }
            })
        conv2Wrapper.select(`#conv2Outline-${i}`)
            .attr("width", conv2CellWidth * conv2Data[0].length)
            .attr("height", conv2CellHeight * conv2Data.length)
            .attr("stroke-width", outlineSize);
    }

    const outputData = prediction[prediction.length - 1].arraySync()[0];
    const outputCellWidth = outputLayerHeight / outputData.length;
    const outputCellHeight = outputLayerHeight / outputData.length;
    const outputLeftMargin = conv2LeftMargin + outlineSize + (conv2CellWidth * conv2Data[0].length) + (layerOffset * (innerLayerDisplay.conv2.length - 1)) + gapSize;
    const outputUpperMargin = outlineSize / 2 + (inputLayerHeight + inputUpperOffset - outputLayerHeight) / 2;
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
        .attr("height", outputCellHeight * outputData.length)
        .attr("stroke-width", outlineSize);
}
