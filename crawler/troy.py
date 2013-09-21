#!/bin/env python
#coding:utf-8

__author__="g"
__date__ ="$2013-08-19 16:07:47$"

import os
import sys
import sched
import time
import commands
import re
from copy import deepcopy

import urllib2
from urllib import urlencode

import platform
if platform.python_version() >= 2.6:
    import json
else:
    import simplejson as json


class STDCollector:

    def __init__(self):
        self.__collector = []
        
    def write(self, buf):

        t = time.time()
        pattern = re.compile(r'^@@(?P<field>[\w\.]+)\s+(?P<value>[\d\.]+)')
        for line in buf.split('\n'):
            match = pattern.match(line)
            if match:
                r = match.groupdict()
                r['time'] = t
                self.__collector.append(r)

    def read(self):
        data = deepcopy(self.__collector)
        self.__collector = []
        return data

    def __del__(self):
        f = open('stdout.log', 'w+')
        for i in self.__debug: #for i in self.__collector:
            f.write(i)
        f.close()


class Troy:

    def __init__(self, stdcollector):
        self.__stdcollector = stdcollector
        self.__scheduler = sched.scheduler(time.time, time.sleep)
        self.__scripts = {}
        self.__cnf = {
            'update_addr': 'http://monitor.m/update',
            'update_version_addr': 'http://monitor.m/version',
            'update_detect_interval': 300,
            'upload_addr': 'http://monitor.m/upload',
            'upload_interval': 300,
            'version': 0,
            'watch_items': []
        }

    def start(self):
        if len(self.__cnf['watch_items']) < 1:
            self.__update_conf()

        for item in self.__cnf['watch_items']:
            if item['type'] != 'python': # shell
                self.__scripts[item['name']] = item['script']
            else: # python
                self.__scripts[item['name']] = compile(item['script'], 'stderr.log', 'exec')
            self.__load(item['interval'], item['name'], item['type'])

        self.__scheduler.enter(self.__cnf['update_detect_interval'], 1, self.__update, ())
        self.__scheduler.enter(self.__cnf['upload_interval'], 1, self.__post, (self.__cnf['upload_addr'], {"data": self.__stdcollector.read()},))
        self.__scheduler.run()

    def __conf(self, cnf):
        self.__cnf.update(cnf)

    def __update_conf(self):
        try:
            conf = self.__get(self.__cnf['update_addr'], {}).strip()
            conf = json.loads(conf)
            self.__conf(conf)
            return True
        except:
            # @todo log
            return False

    def __update(self):
        self.__scheduler.enter(self.__cnf['update_detect_interval'], 1, self.__update, ())

        # check version
        ver = self.__get(self.__cnf['update_version_addr']).strip()
        ver = json.loads(ver)
        if ver['version'] == self.__cnf['version']:
            return

        # update and reload
        if self.__update_conf():
            self.__restart()

    def __restart(self):
        self.__scripts = {}
        for e in self.__scheduler.queue:
            self.__scheduler.cancel(e)
        self.start()

    def __load(self, intval, name, stype):
        self.__run(name, stype)
        self.__scheduler.enter(intval, 1, self.__load, (intval, name, stype,))

    def __run(self, name, stype):
        if stype != 'python':
            print commands.getstatusoutput(self.__scripts[name])[1]
        else: # shell
            exec(self.__scripts[name], {})

    def __get(self, uri, params = {}):
        return urllib2.urlopen("%s?%s" % (uri, urlencode(params))).read();
    
    def __post(self, uri, params = {}):
        self.__scheduler.enter(self.__cnf['upload_interval'], 1, self.__post, (self.__cnf['upload_addr'], {"data": self.__stdcollector.read()},))

        data = json.dumps(params)
        req = urllib2.Request(uri, data, {'Content-Type': 'application/json'})
        return urllib2.urlopen(req).read()


if __name__ == '__main__':

    os.system("echo %s > /dev/shm/troy.pid" % os.getpid())

    fout = STDCollector()
    sys.stdout = fout

    Troy(fout).start()
