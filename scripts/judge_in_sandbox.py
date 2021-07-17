# submissin.conf load
submission = {}
f = open("submission.conf")
line = f.readline().strip()
while line:
    submission[line.split(' ')[0]] = line.split(' ')[1]
    line = f.readline().strip()
f.close()

lang = submission['answer_language']

import os
import sys

os.system('rm -rf answer.result')
if lang == 'C++':
    print('./answer < ../input/' + sys.argv[1] + ' > answer.result')
    os.system('./answer < ../input/' + sys.argv[1] + ' > answer.result')