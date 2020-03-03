import {main} from './convIntro/main';
import {init_cnn_vis} from './cnn_vis';

function loadSections() {
  main();
  init_cnn_vis();
}

window.onload = loadSections;
