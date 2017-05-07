import _ from 'lodash';

export default function(element, keycodes) {
  var state = _.reduce(keycodes, function(memo, code){
    memo[code] = false;
    return memo;
  }, {});

  element.addEventListener('keydown', function(e){
    if (state.hasOwnProperty(e.code)) {
      state[e.code] = true;
      e.preventDefault();
      return false;
    }
  });
  element.addEventListener('keyup', function(e){
    if (state.hasOwnProperty(e.code)) {
      state[e.code] = false;
      return false;
    }
  });

  return state;
};
