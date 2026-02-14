"""Configuration loader with environment variable substitution"""
import os
import re
from pathlib import Path
from typing import Any, Dict

import yaml
from loguru import logger


class ConfigLoader:
    """Load and parse YAML configuration files with environment variable support"""
    
    def __init__(self):
        self.env_pattern = re.compile(r'\$\{([^}]+)\}')
    
    def load(self, config_path: str) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        config_file = Path(config_path)
        
        if not config_file.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_path}")
        
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
            
            if config is None:
                logger.warning(f"Configuration file {config_path} is empty or invalid")
                config = {}
            
            # Substitute environment variables
            config = self._substitute_env_vars(config)
            
            logger.info(f"Configuration loaded from: {config_path}")
            return config
        except yaml.YAMLError as e:
            logger.error(f"Error parsing YAML configuration file {config_path}: {e}")
            raise ValueError(f"Invalid YAML in configuration file: {e}") from e
        except Exception as e:
            logger.error(f"Error loading configuration file {config_path}: {e}")
            raise
    
    def _substitute_env_vars(self, obj: Any) -> Any:
        """Recursively substitute environment variables in config"""
        if isinstance(obj, dict):
            return {key: self._substitute_env_vars(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._substitute_env_vars(item) for item in obj]
        elif isinstance(obj, str):
            # Replace ${VAR_NAME} with environment variable value
            def replace_env(match):
                var_name = match.group(1)
                default_value = None
                
                # Check for default value syntax: ${VAR_NAME:default}
                if ':' in var_name:
                    parts = var_name.split(':', 1)
                    if len(parts) == 2:
                        var_name, default_value = parts
                    else:
                        # Invalid syntax, return original
                        logger.warning(f"Invalid environment variable syntax: {match.group(0)}")
                        return match.group(0)
                
                # Validate variable name to prevent injection
                if not var_name or not var_name.replace('_', '').isalnum():
                    logger.warning(f"Invalid environment variable name: {var_name}")
                    return match.group(0)
                
                env_value = os.getenv(var_name, default_value)
                if env_value is None:
                    logger.warning(f"Environment variable {var_name} not set and no default provided")
                    return match.group(0)  # Return original if not found
                return env_value
            
            return self.env_pattern.sub(replace_env, obj)
        else:
            return obj

