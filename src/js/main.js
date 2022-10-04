import 'focus-visible';
import {isWebp} from './modules/isWebp.js';

// CHECK SUPPORT WEBP FORMAT
(async () => {
  (await isWebp())
    ? document.querySelector('html').classList.add('webp')
    : document.querySelector('html').classList.add('no-webp');
})();
import {sum} from './modules/test.js';

const inner = document.querySelector('#inner');
inner.innerText = sum(10, 20);