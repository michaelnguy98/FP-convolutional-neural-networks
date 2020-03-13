import {initConvIntroSection} from './convIntro/main';
import {init_cnn_vis} from './cnn_vis';
import {initMultiConvSection} from './multi-conv';
import {init_real_cnn} from './real_cnn'

function loadSections() {
  initMultiConvSection();
  initConvIntroSection();
  init_cnn_vis();
  init_real_cnn();
}

window.onload = loadSections;
