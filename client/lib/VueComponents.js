import Vue from 'vue';

var loadavg = {
  props: ['load'],
  template: '#loadavg'
};

var hostname = {
  props: ['hostname'],
  template: '#hostname'
};

var freemem = {
  props: ['freemem'],
  template: '#freemem'
};

var currentfolder = {
  props: ['currentfolder', 'isgameroot'],
  template: '#currentfolder'
};

var radar = {
  props: ['files', 'shipposition'],
  template: '#radar'
};

export default {loadavg, hostname, freemem, currentfolder, radar};