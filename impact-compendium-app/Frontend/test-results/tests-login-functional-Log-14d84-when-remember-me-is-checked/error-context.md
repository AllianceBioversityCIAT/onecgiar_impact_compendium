# Page snapshot

```yaml
- generic [ref=e5]:
  - img "Impact Compendium Logo" [ref=e7]
  - generic [ref=e8]:
    - heading "Log in" [level=1] [ref=e9]
    - paragraph [ref=e10]: Enter your email and password to access your account
  - generic [ref=e11]:
    - generic [ref=e12]:
      - generic [ref=e13]: Email address
      - textbox "Email address" [ref=e14]:
        - /placeholder: you@organization.org
    - generic [ref=e15]:
      - generic [ref=e16]: Password
      - generic [ref=e17]:
        - textbox "Password" [ref=e18]:
          - /placeholder: Enter your password
        - button "Show password" [ref=e19] [cursor=pointer]:
          - img [ref=e20]
    - generic [ref=e23]:
      - generic [ref=e24]:
        - checkbox "Remember me" [ref=e25]
        - generic [ref=e26]: Remember me
      - button "Forgot password?" [ref=e27] [cursor=pointer]
    - button "Login" [ref=e28] [cursor=pointer]
  - paragraph [ref=e30]:
    - text: Need help? Contact PRMS technical support at
    - link "prms-tech-support@cgiar.org" [ref=e31] [cursor=pointer]:
      - /url: mailto:prms-tech-support@cgiar.org
```