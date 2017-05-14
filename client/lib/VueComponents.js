import Vue from 'vue';

var loadavg = Vue.component('loadavg', {
  props: ['load'],
  template: '#loadavg'
});

var hostname = Vue.component('hostname', {
  props: ['hostname'],
  template: '#hostname'
});

var freemem = Vue.component('freemem', {
  props: ['freemem'],
  template: '#freemem'
});

var currentfolder = Vue.component('currentfolder', {
  props: ['currentfolder', 'isgameroot'],
  template: '#currentfolder'
});

var radar = Vue.component('radar', {
  props: ['files', 'shipposition'],
  template: '#radar'
});

export {loadavg, hostname, freemem, currentfolder, radar};