




































<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>___/ Silverpeas&#8482; - Collaborative portal \_________________________________________</title>
    <link rel="SHORTCUT ICON" href='/silverpeas/util/icons/favicon.ico'/>
    <link type="text/css" rel="stylesheet" href="/silverpeas/style.css"/>
    <link href='/silverpeas/util/styleSheets/jquery/ui-lightness/jquery-ui-1.10.3.custom-min.css?v=60SNAPSHOT' type='text/css' rel='stylesheet'/><script type='text/javascript' src='/silverpeas/util/javaScript/jquery/jquery-1.10.2.min.js?v=60SNAPSHOT' language='Javascript'></script><script type='text/javascript' src='/silverpeas/util/javaScript/jquery/jquery-ui-1.10.3.custom.min.js?v=60SNAPSHOT' language='Javascript'></script><script type='text/javascript' src='/silverpeas/util/javaScript/jquery/jquery.json-2.3.min.js?v=60SNAPSHOT' language='Javascript'></script><script type='text/javascript' src='/silverpeas/util/javaScript/jquery/jquery.i18n.properties-min-1.0.9.js?v=60SNAPSHOT' language='Javascript'></script>
    <script type='text/javascript' src='/silverpeas/util/javaScript/silverpeas-tkn.js?_=1467037088117' language='Javascript'></script><script type='text/javascript' language='Javascript'>function applyTokenSecurity(targetContainerSelector){if(typeof setTokens === 'function'){setTokens(targetContainerSelector);}}function applyTokenSecurityOnMenu(){if(typeof setTokens === 'function'){setTokens('#menubar-creation-actions');}}</script>
    <script type="text/javascript">
        <!--
        // Public domain cookie code written by:
        // Bill Dortch, hIdaho Design
        // (bdortch@netw.com)
        function getCookieVal(offset) {
            var endstr = document.cookie.indexOf(";", offset);
            if (endstr === -1) {
                endstr = document.cookie.length;
            }
            return unescape(document.cookie.substring(offset, endstr));
        }

        function GetCookie(name) {
            var arg = name + "=";
            var alen = arg.length;
            var clen = document.cookie.length;
            var i = 0;
            while (i < clen) {
                var j = i + alen;
                if (document.cookie.substring(i, j) === arg)
                    return getCookieVal(j);
                i = document.cookie.indexOf(" ", i) + 1;
                if (i === 0) break;
            }

            return null;
        }

        function checkForm() {
            $("form").submit();
        }

        function checkCookie() {
            
        }

        function loginQuestion() {
            var form = document.getElementById("formLogin");
            if (form.elements["Login"].value.length === 0) {
                alert('Veuillez renseigner votre login');
            } else {
                form.action = '/silverpeas/CredentialsServlet/LoginQuestion';
                form.submit();
            }
        }

        function resetPassword() {
            var form = document.getElementById("formLogin");
            if (form.elements["Login"].value.length === 0) {
                alert('Veuillez renseigner votre login');
            } else {
                form.action = '/silverpeas/CredentialsServlet/ForgotPassword';
                form.submit();
            }
        }

        function changePassword() {
            var form = document.getElementById("formLogin");
            if (form.elements["Login"].value.length === 0) {
                alert('Veuillez renseigner votre login');
            } else {
                form.action = '/silverpeas/CredentialsServlet/ChangePasswordFromLogin';
                form.submit();
            }
        }

        function newRegistration() {
            var form = document.getElementById("formLogin");
            form.action = '/silverpeas/CredentialsServlet/NewRegistration';
            form.submit();
        }

        $(document).ready(function () {
            $("#DomainId").keypress(function (event) {
                if (event.keyCode === 13) {
                    checkForm();
                }
            });

            $("form").submit(function () {
                checkCookie();
            });
        });
        -->
    </script>
    <meta name="viewport" content="initial-scale=1.0"/>
</head>
<body>
<form id="formLogin" action="/silverpeas/AuthenticationServlet" method="post" accept-charset="UTF-8">
    
    
    <div class="page"> <!-- Centrage horizontal des elements (960px) -->
        <div class="titre">Intranet</div>
        <div id="background"> <!-- image de fond du formulaire -->
            <div class="cadre">
                <div id="header" style="display: table; width: 100%">
                    <div style="display: table-cell">
                        <img src="/silverpeas/images/logo.jpg" class="logo" alt="logo"/>
                    </div>
                    <div class="information" style="display: table-cell; width: 100%; text-align: right">
                        
                            
                            
                                Ecran de connexion
                            
                        
                        
                    </div>
                    <div class="clear"></div>
                </div>

                <p>
                    <label><span>Démo</span>
                        <select style="display: block; width: 448px; margin-bottom: 15px" id="accounts"></select></span></label>
                </p>

                <p>
                    <label><span>Identifiant</span><input type="text" name="Login"
                                                                                              id="Login"/><input
                            type="hidden" class="noDisplay" name="cryptedPassword"/></label>
                </p>

                <p>
                    <label><span>Mot de passe</span><input type="password"
                                                                                                 name="Password"
                                                                                                 id="Password"/></label>
                </p>

                <script type="text/javascript">

                    $(function () {

                        var demoAccounts = [
                            {user: "remi"},
                            {user: "miguel"},
                            {user: "nicolas"},
                            {user: "yohann"},
                            {user: "david"},
                        ];

                        var defaultPassword = "azerty";

                        var list = $("#accounts");
                        list.change(function () {
                            $("#Login").val(list.val());
                            $("#Password").val(defaultPassword);
                        });

                        $.each(demoAccounts, function (index, val) {
                            var opt = $("<option></option>").attr({value: val.user + "-silverpeas"}).text(val.user);
                            list.append(opt);
                        });

                    });

                </script>

                
                    
                        <input class="noDisplay" type="hidden" name="DomainId" value="0"/>
                    
                    
                    
                

                <p>
                    <input type="submit" style="width:0; height:0; border:0; padding:0"/>
                    <a href="#" class="submitWithOneDomain" onclick="checkForm()"><span><span>LOGIN</span></span></a>
                </p>

                
                
                <p>
          <span class="forgottenPwd">
          
            <a href="javascript:resetPassword()">Réinitialiser mon mot de passe...</a>
          
          </span>
                        

                        

                    
                </p>
                

                
                
            </div>
        </div>
        <div id="copyright">&copy; 2001-2015 <a href="http://www.silverpeas.com" target="_blank">Silverpeas</a> - Tous droits réservés</div>
    </div>
</form>
<!-- Fin class="page" -->

<script type="text/javascript">
    var nbCookiesFound = 0;
    var domainId = null;

    /* Si le domainId n'est pas dans la requete, alors recuperation depuis le cookie */
    if (domainId === null && GetCookie("defaultDomain")) {
        
    }

    if (GetCookie("svpLogin")) {
        nbCookiesFound = nbCookiesFound + 1;
        document.getElementById("Login").value = GetCookie("svpLogin").toString();
    }

    

    if (nbCookiesFound === 2) {
        document.getElementById("formLogin").cryptedPassword.value = "Yes";
        
    } else {
        document.getElementById("formLogin").Password.value = '';
        document.getElementById("formLogin").Login.focus();
    }
    document.getElementById("formLogin").Login.focus();
</script>

</body>
</html>
