#!/usr/bin/python

from __future__ import print_function

import sys
import os
import math
import pprint
import time
import datetime
import re
import random

# in bytes
TRACE_FILE_SIZE = 10240 * 10240

NUMBER_OF_RADIOS = 5

# trace file name
TRACE_FILE_NAME = "trace.data"

class RadioGenerator:

    def __init__(self, addr):
        self.addr = addr
        self.next_time = 0.0
        self.next_event = None
        self.__gen_next_event()

    def __coordinates_random(self):
        lon = 47.658636 + random.uniform(-0.0001, 0.0001)
        lat = 11.786344 + random.uniform(-0.0001, 0.0001)
        ret = "COORDINATE {{ 'lon':{}, 'lat':{} }}".format(lon, lat)
        return ret

    def __gen_next_event(self):
        self.next_event = self.__coordinates_random()

    def __pop(self):
        ret = [self.next_time, self.addr, self.next_event]
        self.next_event = None
        return ret

    def pop(self):
        if not self.next_event:
            self.__gen_next_event()
            self.next_time += random.uniform(0.001, 1.0)
        return self.__pop()


def write_data(fd, data):
    fd.write("{} {} {} {}\n".format(data[0], data[0],
                                    data[1], data[2]))

def len_data(data):
    return len("{} {} {} {}\n".format(data[0], data[0],
                                      data[1], data[2]))

def main():
    written_bytes = 0
    ri = []; tmp = []
    # init stage
    for i in range(NUMBER_OF_RADIOS):
        ri.append(RadioGenerator(i))

    while True:
        # processing stage
        for i in range(NUMBER_OF_RADIOS):
            d = ri[i].pop()
            written_bytes += len_data(d)
            tmp.append(d)

        if written_bytes > TRACE_FILE_SIZE:
            break

    tmp.sort(key=lambda x: x[0])
    print("Write tracefile with {} radios to file: {}".format(
          NUMBER_OF_RADIOS, TRACE_FILE_NAME))
    fd = open(TRACE_FILE_NAME, "w")
    for data in tmp:
        write_data(fd, data)
    fd.close()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.stderr.write("SIGINT received, exiting\n")
