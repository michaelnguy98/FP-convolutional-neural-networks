import {initConvIntroSection} from './convIntro/main';
import {init_cnn_vis} from './cnn_vis';
import {initMultiConvSection} from './multi-conv';

function loadSections() {
  initMultiConvSection();
  initConvIntroSection();
  init_cnn_vis();
}

window.onload = loadSections;
