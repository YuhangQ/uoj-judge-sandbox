

import sys

# submissin.conf load
submission = {}
f = open("submission.conf")
line = f.readline().strip()
while line:
    submission[line.split(' ')[0]] = line.split(' ')[1]
    line = f.readline().strip()
f.close()

lang = submission['answer_language']

res = 0

import os
if lang == 'C++':
    if('withImplementer' in sys.argv):
        res = os.system('g++ 2>compile.result -x c++ answer.code implementer.cpp -o answer')
    else:
        res = os.system('g++ 2>compile.result -x c++ answer.code -o answer')
if lang == 'C++11':
    if('withImplementer' in sys.argv):
        res = os.system('g++ 2>compile.result -x c++ -std=c++11 answer.code implementer.cpp -o answer')
    else:
        res = os.system('g++ 2>compile.result -x c++ -std=c++11 answer.code -o answer')
if lang == 'C':
    if('withImplementer' in sys.argv):
        res = os.system('gcc 2>compile.result -x c answer.code implementer.c -o answer')
    else:
        res = os.system('gcc 2>compile.result -x c answer.code -o answer')
if lang == 'Pascal':
    res = os.system('fpc 2>compile.result answer.code -O2')

import re

if lang == 'Java8':
    content = open("answer.code").read()
    name = re.search("class (.*)\\b", content).groups()[0]
    os.system('mv answer.code ' + str(name) + '.java')
    os.system('/usr/lib/jvm/java-8-openjdk-amd64/bin/javac ' + str(name) + '.java')

if lang == 'Java11':
    content = open("answer.code").read()
    name = re.search("class (.*)\\b", content).groups()[0]
    os.system('mv answer.code ' + str(name) + '.java')
    os.system('/usr/lib/jvm/java-11-openjdk-amd64/bin/javac ' + str(name) + '.java')

if res != 0: res = -1
exit(res)