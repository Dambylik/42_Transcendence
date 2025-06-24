export function loginGooglePage()
{
        return `<div>
        <h2>Login with google</h2>
        <div id="buttonDivGoogle"></div>
        </div>`;
}

export function showLoginGoogleButton()
{
  google.accounts.id.renderButton(
    document.getElementById('buttonDivGoogle')!,
    {
      theme: 'outline',
      size: 'large',
    }
  );
}
