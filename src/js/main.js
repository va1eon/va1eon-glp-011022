import {sum} from './modules/test.js';

const inner = document.querySelector('#inner');
inner.innerText = sum(10, 20);