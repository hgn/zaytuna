#!/usr/local/bin/python

# this python script is available at
# https://gist.github.com/jessearmand/4025012
#
# Added handling of proxy server authentication
# and automatic re-download of missing tiles.
#
# For Zaytuna, tiles for zoom levels 1-3 have been downloaded worldwide.
# The max. downloaded zoom level is 15. The borders are:
# South 47.4
# West 11.38
# North 48
# East 12.2

from sys import argv
import os
import math
import urllib2
import random
import time
import getpass

def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.log(math.tan(lat_rad) + (1 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
    return (xtile, ytile)

def download_url(zoom, xtile, ytile, download_path, missing_files):
    # Switch between otile1 - otile4
    subdomain = random.randint(1, 4)

    url = "http://otile%d.mqcdn.com/tiles/1.0.0/osm/%d/%d/%d.png" % (subdomain, zoom, xtile, ytile)
    dir_path = "%s/tiles/%d/%d/" % (download_path, zoom, xtile)
    download_path = "%s/tiles/%d/%d/%d.png" % (download_path, zoom, xtile, ytile)

    if os.path.exists(download_path):
        statinfo = os.stat(download_path)
        if statinfo.st_size == 79:
            missing_files = missing_files + 1
            print "missing files: {}".format(missing_files)
            os.remove(download_path)
        else:
            return missing_files
    else:
        missing_files = missing_files + 1

    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
    
    try:
        print "downloading {}".format(url)
        source = urllib2.urlopen(url)
    except:
        return missing_files
    
    content = source.read()
    source.close()
    destination = open(download_path,'wb')
    destination.write(content)
    destination.close()
    return missing_files

def usage():
    print "Usage: "
    print "osm_maps_downloader <south_latitude> <west_longitude> <north_latitude> <east_longitude> <min_zoom> <max_zoom> <download_path>"

def download_files(south, west, north, east, min_zoom, max_zoom, download_path, user_name, password):
    proxy = urllib2.ProxyHandler({'http': 'http://' + user_name + ':' + password + '@proxy-emea.rsint.net:80'})
    auth = urllib2.HTTPBasicAuthHandler()
    opener = urllib2.build_opener(proxy, auth, urllib2.HTTPHandler)
    urllib2.install_opener(opener)

    missing_files = 0
    for zoom in range(int(min_zoom), int(max_zoom) + 1, 1):
        xtile, ytile = deg2num(float(south), float(west), float(zoom))
        final_xtile, final_ytile = deg2num(float(north), float(east), float(zoom))

        print "xtile: {}, final_xtile: {}".format(xtile, final_xtile)
        for x in range(xtile, final_xtile + 1, 1):
            print "x: {}".format(x)
            for y in range(ytile, final_ytile - 1, -1):
                missing_files = download_url(int(zoom), x, y, download_path, missing_files)
    print "found {} missing files".format(missing_files)
    return missing_files

def main(argv):
    try:
        script, south, west, north, east, min_zoom, max_zoom, download_path = argv
    except:
        usage()
        exit(2)

    user_name = raw_input("Enter user name for Internet proxy: ")
    password = getpass.getpass()

    while True:
        ret = download_files(south, west, north, east, min_zoom, max_zoom, download_path, user_name, password)
        if ret == 0:
            print "no missing files, exiting"
            break
        time.sleep(5)

main(argv)