#!/usr/bin/env python3

"""
Plugin schema processor and validator
Copyright (C) 2024 Universal Devices
"""
from ioxplugin import StoreEntry
import argparse

def install_on_iox():
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

    plugin=Plugin(json_file, project_path)
    store=StoreEntry(plugin)

if __name__ == "__main__":
    install_on_iox()
