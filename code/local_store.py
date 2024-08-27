#!/usr/bin/env python3

"""
Plugin schema processor and validator
Copyright (C) 2024 Universal Devices
"""
from ioxplugin import PluginStoreOps
from ioxplugin import PLUGIN_LOGGER, IoXPluginLoggedException, Plugin, PluginMetaData, init_ext_logging
import argparse

def add_plugin():
    project_path = "/usr/home/admin/workspace/ioxplugin/tests"
    json_file = f"{project_path}/dimmer.iox_plugin.json"
    email = "tech@universal-devices.com"
    devUser = "admin"
    try:
        parser = argparse.ArgumentParser(description="the path IoX Plugin json file")
    
        parser.add_argument('project_path', type=str, help='path to the project directory')
        parser.add_argument('json_file', type=str, help='path to the json file')
        parser.add_argument('email', type=str, help='developer account email address')
        parser.add_argument('devUser', type=str, help='local user on the development machine')
        
        args = parser.parse_args()

        project_path = args.project_path
        json_file = args.json_file
        email=args.email
        devUser=args.devUser
        init_ext_logging(project_path)
    except SystemExit as ex:
        pass

    try:
        storeOps=PluginStoreOps('Local', project_path)
        storeOps.addToStore(json_file, email, devUser)
    except Exception as ex:
        PLUGIN_LOGGER.error("Failed creating store entry ..", exc_info=True)

if __name__ == "__main__":
    add_plugin()