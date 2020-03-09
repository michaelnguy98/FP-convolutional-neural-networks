import {initConvIntroSection} from './convIntro/main';
import {init_cnn_vis} from './cnn_vis';
import {initMultiConvSection} from './multi-conv';
import {initAnimateMathSection} from './animateMath';
import {initAnimateRGBSection} from './animateRGB';

function loadSections() {
  initAnimateRGBSection();
  initAnimateMathSection();
  initMultiConvSection();
  initConvIntroSection();
  init_cnn_vis();
}

window.onload = loadSections;
