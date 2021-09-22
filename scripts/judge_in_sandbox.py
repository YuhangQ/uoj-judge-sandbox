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

if lang == 'C++' or lang == 'C' or lang == 'C++11' or lang == 'Pascal':
    res = os.system('./answer < %s > %s ' % (inputfile, outputfile))
if lang == 'Python3':
    res = os.system('python3 ./answer.code < %s > %s ' % (inputfile, outputfile))
if lang == 'Python2':
    res = os.system('python2 ./answer.code < %s > %s ' % (inputfile, outputfile))

if lang == 'Java8':
    for file in os.listdir('.'):
        if file.endswith('.class'):
            os.system('/usr/lib/jvm/java-8-openjdk-amd64/bin/java %s -Xmx1024m -Xss1024m < %s > %s ' % (file[:-6], inputfile, outputfile))


if lang == 'Java11':
    for file in os.listdir('.'):
        if file.endswith('.class'):
            os.system('/usr/lib/jvm/java-11-openjdk-amd64/bin/java %s -Xmx1024m -Xss1024m < %s > %s ' % (file[:-6], inputfile, outputfile))


if res != 0: res = -1
exit(res)