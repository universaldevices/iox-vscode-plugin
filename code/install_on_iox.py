#!/usr/bin/env python3
"""
Plugin schema processor and validator
Copyright (C) 2024 Universal Devices
"""
from ioxplugin import StoreOps
from ioxplugin import PLUGIN_LOGGER, IoXPluginLoggedException, Plugin, PluginMetaData, init_ext_logging
import argparse

def install_plugin():
    project_path = "/usr/home/admin/workspace/ioxplugin/tests"
    username = "admin"
    password = "admin"
    try:
        parser = argparse.ArgumentParser(description="Username/Password for local PG3")
    
        parser.add_argument('project_path', type=str, help='path to the project directory')
        parser.add_argument('username', type=str, help='the username for PG3')
        parser.add_argument('password', type=str, help='the password for PG3')
        
        args = parser.parse_args()

        project_path=args.project_path
        username = args.username
        password = args.password
    except SystemExit as ex:
        pass

    try:
        storeOps=PluginStoreOps('Local', project_path)
        storeOps.install('admin','admin')
    except Exception as ex:
        PLUGIN_LOGGER.error("Failed installing the plugin..", exc_info=True)

if __name__ == "__main__":
    install_plugin()