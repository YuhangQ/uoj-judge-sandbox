


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
if lang == 'C++':
    os.system('g++ -x c++ answer.code  -o answer')