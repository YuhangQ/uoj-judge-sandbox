

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
    res = os.system('g++ 2>compile.result -x c++ answer.code -o answer')

if res != 0: res = -1
exit(res)