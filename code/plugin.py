#!/usr/bin/env python3

"""
Plugin schema processor and validator
Copyright (C) 2024 Universal Devices
"""
from ioxplugin import Plugin
import argparse

def generate_code():
    project_path = "/usr/home/admin/workspace/plugin-dev/ext"
    json_file = f"{project_path}/dimmer.iox_plugin.json"
    try:
        parser = argparse.ArgumentParser(description="the path IoX Plugin json file")
    
        parser.add_argument('project_path', type=str, help='path to the project directory')
        parser.add_argument('json_file', type=str, help='path to the json file')
        
        args = parser.parse_args()

        project_path = args.project_path
        json_file = args.json_file
    except SystemExit as ex:
        pass

    #print (project_path)
    #print (json_file)
    mod=Plugin(json_file, project_path)
    mod.toIoX()
    mod.generateCode(project_path)

if __name__ == "__main__":
    generate_code()

