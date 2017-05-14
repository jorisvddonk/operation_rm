import _ from 'lodash';

/*
Utility service which captures keyboard state.
*/
export default function(element, keycodes) {
  var aliases = {
    "KeyW": "ArrowUp",
    "KeyA": "ArrowLeft",
    "KeyS": "ArrowDown",
    "KeyD": "ArrowRight",
  };

  var state = _.reduce(keycodes, function(memo, code){
    memo[code] = false;
    return memo;
  }, {});

  var translateKey = function(code) {
    if (aliases.hasOwnProperty(code)) {
      return aliases[code];
    }
    return code;
  }

  element.addEventListener('keydown', function(e){
    var keyCode = translateKey(e.code);
    if (state.hasOwnProperty(keyCode)) {
      state[keyCode] = true;
      e.preventDefault();
      return false;
    }
  });
  element.addEventListener('keyup', function(e){
    var keyCode = translateKey(e.code);
    if (state.hasOwnProperty(keyCode)) {
      state[keyCode] = false;
      return false;
    }
  });

  return state;
};
