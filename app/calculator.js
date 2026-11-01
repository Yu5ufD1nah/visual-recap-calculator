export function keyToInput(key) {
  if (/^[0-9.+*/=-]$/.test(key)) return key;
  if (key === 'Enter') return '=';
  if (key === 'Backspace') return 'backspace';
  if (key === 'Escape' || key === 'Delete') return 'clear';
  return null;
}

export function calculate(left, operator, right) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) throw new Error('Enter valid numbers');
  let result;
  switch (operator) {
    case '+': result = left + right; break;
    case '-': result = left - right; break;
    case '*': result = left * right; break;
    case '/':
      if (right === 0) throw new Error('Cannot divide by zero');
      result = left / right; break;
    default: throw new Error('Unknown operation');
  }
  if (!Number.isFinite(result)) throw new Error('Result is too large');
  return Number(result.toPrecision(12));
}

export function createCalculator() {
  let display = '0', left = null, operator = null, fresh = true, error = false;
  function reset() { display = '0'; left = null; operator = null; fresh = true; error = false; }
  function input(key) {
    if (key === 'clear') { reset(); return display; }
    if (error) reset();
    if (/^\d$/.test(key)) {
      display = fresh || display === '0' ? key : display.length < 15 ? display + key : display;
      fresh = false;
    } else if (key === '.') {
      if (fresh) display = '0';
      if (!display.includes('.')) display += '.';
      fresh = false;
    } else if (key === 'sign') {
      display = String(-Number(display));
    } else if (key === 'backspace') {
      if (!fresh) display = display.length > 1 ? display.slice(0, -1) : '0';
      if (display === '-') display = '0';
    } else if (['+', '-', '*', '/', '='].includes(key)) {
      try {
        if (operator && !fresh) display = String(calculate(left, operator, Number(display)));
        left = Number(display);
        operator = key === '=' ? null : key;
        fresh = true;
      } catch (problem) {
        display = problem.message; error = true; left = null; operator = null; fresh = true;
      }
    }
    return display;
  }
  return {input, get display() { return display; }, get operation() { return operator; }};
}
