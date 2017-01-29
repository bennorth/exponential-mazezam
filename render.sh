#!/bin/bash

# Written by Ben North, 2017.
# Hereby placed into the public domain.
# (Requires local 'refresh-chrome' utility.)

python png-from-txt.py < 6-bar-sample.txt
pandoc content.md -c hugo-octopress.css -H extra-head.html -o index.html
refresh-chrome "Mazezam level family"
