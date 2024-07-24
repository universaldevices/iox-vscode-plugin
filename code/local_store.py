#!/usr/bin/env python3

"""
Plugin schema processor and validator
Copyright (C) 2024 Universal Devices
"""
from ioxplugin import StoreEntry
from ioxplugin import Plugin
import argparse


def add_plugin():
    project_path = "/usr/home/admin/ioxplugin/tests"
    json_file = f"{project_path}/dimmer.iox_plugin.json"
    email = "n/a"
    devUser = "n/a"
    try:
        parser = argparse.ArgumentParser(description="the path IoX Plugin json file")
    
        parser.add_argument('project_path', type=str, help='path to the project directory')
        parser.add_argument('json_file', type=str, help='path to the json file')
        parser.add_argument('email', type=str, help='developer account email address')
        parser.add_argument('devUser', type=str, help='local user on the development machine')
        
        args = parser.parse_args()

        project_path = args.project_path
        json_file = args.json_file
        email = args.email
        devuser = args.devUser
    except SystemExit as ex:
        pass

    try:
        plugin=Plugin(json_file, project_path)
        store=StoreEntry(plugin)
        store.addToStore(email, devUser, project_path)
    except Exception as ex:
        raise

if __name__ == "__main__":
    add_plugin()