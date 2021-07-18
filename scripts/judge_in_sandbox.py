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

res = 0

os.system('rm -rf answer.result')

inputfile = '../input/' + sys.argv[1]
outputfile = 'answer.result'

if lang == 'C++':
    res = os.system('./answer < %s > %s ' % (inputfile, outputfile))

if res != 0: res = -1
exit(res)