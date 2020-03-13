import {initConvIntroSection} from './convIntro/main';
import {init_cnn_vis} from './cnn_vis';
import {initMultiConvSection, resizeMultiConv} from './multi-conv';
import {initAnimateMathSection, resizeAnimateMath} from './animateMath';
import {initAnimateRGBSection, resizeAnimateRGB} from './animateRGB';
import {recalculateConfig} from './config';
import { resizeIntroConv } from './convIntro/initSVG';

function loadSections() {
  initAnimateRGBSection();
  initAnimateMathSection();
  initMultiConvSection();
  initConvIntroSection();
  init_cnn_vis();
}

function onResize() {
  recalculateConfig();
  
  resizeAnimateRGB();
  resizeAnimateMath();
  resizeIntroConv();

  resizeMultiConv()
}

window.onload = loadSections;

window.onresize = onResize;
