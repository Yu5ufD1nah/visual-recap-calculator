import {createCalculator} from './calculator.js';
const calculator = createCalculator();
const output = document.querySelector('#result');
const status = document.querySelector('#operation');
const symbols = {'*': '×', '/': '÷', '-': '−', '+': '+'};
function press(value) {
  output.textContent = calculator.input(value);
  status.textContent = calculator.operation ? symbols[calculator.operation] + ' selected' : 'Ready for your next calculation';
  document.querySelectorAll('[data-key]').forEach(button => {
    if (button.classList.contains('operator')) button.setAttribute('aria-pressed', String(button.dataset.key === calculator.operation));
  });
}
document.querySelectorAll('[data-key]').forEach(button => button.addEventListener('click', () => press(button.dataset.key)));
