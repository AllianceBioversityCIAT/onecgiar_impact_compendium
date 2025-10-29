"""
Email utility functions
"""

def extract_username_from_email(email: str) -> str:
    """
    Extract username from email address
    
    Args:
        email: Email address (e.g., "john.doe@example.com")
        
    Returns:
        Username part of email (e.g., "john.doe")
    """
    return email.split('@')[0]


def generate_readable_username(email: str, max_attempts: int = 5) -> str:
    """
    Generate a readable username from email with fallback options
    
    Args:
        email: Email address
        max_attempts: Maximum attempts for username generation
        
    Returns:
        Readable username
    """
    base_username = extract_username_from_email(email)
    
    # Clean username: remove dots, underscores, numbers at the end
    clean_username = base_username.replace('.', '').replace('_', '').replace('-', '')
    
    # If clean username is too short, use original
    if len(clean_username) < 3:
        clean_username = base_username
    
    # Try different readable formats
    username_options = [
        clean_username,                    # "johndoe"
        base_username,                     # "john.doe" 
        f"{clean_username}user",           # "johndoeuser"
        f"{base_username.replace('.', '')}" # "johndoe"
    ]
    
    return username_options[0]  # Return the cleanest option
