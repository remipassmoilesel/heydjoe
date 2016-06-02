//
// KeyStoreImport.java
//
// Utilitaire permettant de manipuler des clefs pour OpenFire (et pas que)
//
// Usage:
// $ javac KeyStoreImport.java
// $ java KeyStoreImport keystore test-messagerie.ddns.net.crt.der test-messagerie.ddns.net.key.der "test-messagerie.ddns.net"
//
//
// Adds a specified certificate chain and associated RSA private key
// to a Java keystore.
//
// Usage: java KeyStoreImport KEYSTORE CERTS KEY ALIAS
//
//              KEYSTORE is the name of the file containing the Java keystore
//              CERTS is the name of a file containing a chain of concatenated
//                      DER-encoded X.509 certificates
//              KEY is the name of a file containing a DER-encoded PKCS#8 RSA
//                      private key
//              ALIAS is the alias for the private key entry in the keystore
//
// Neal Groothuis
// 2006-08-08
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
//
import java.security.*;
import java.security.spec.*;
import java.security.cert.*;
import java.io.*;
import java.util.*;

public class KeyStoreImport {

    public static void main(String args[]) {
        try {
// Meaningful variable names for the arguments
            String keyStoreFileName = args[0];
            String certificateChainFileName = args[1];
            String privateKeyFileName = args[2];
            String entryAlias = args[3];

// Get the password for the keystore.
            System.out.println("Keystore password:  ");

            String keyStorePassword = (new BufferedReader(
                    new InputStreamReader(System.in))).readLine();

// Load the keystore
            KeyStore keyStore = KeyStore.getInstance("jks");
            FileInputStream keyStoreInputStream =
                    new FileInputStream(keyStoreFileName);
            keyStore.load(keyStoreInputStream, keyStorePassword.toCharArray());
            keyStoreInputStream.close();

// Load the certificate chain (in X.509 DER encoding).
            FileInputStream certificateStream =
                    new FileInputStream(certificateChainFileName);
            CertificateFactory certificateFactory =
                    CertificateFactory.getInstance("X.509");
// Required because Java is STUPID.  You can't just cast the result
// of toArray to Certificate[].
            java.security.cert.Certificate[] chain = {};
            chain = certificateFactory.generateCertificates(certificateStream).toArray(chain);
            certificateStream.close();

// Load the private key (in PKCS#8 DER encoding).
            File keyFile = new File(privateKeyFileName);
            byte[] encodedKey = new byte[(int)keyFile.length()];
            FileInputStream keyInputStream = new FileInputStream(keyFile);
            keyInputStream.read(encodedKey);
            keyInputStream.close();
            KeyFactory rSAKeyFactory = KeyFactory.getInstance("RSA");
            PrivateKey privateKey = rSAKeyFactory.generatePrivate(
                    new PKCS8EncodedKeySpec(encodedKey));

// Add the new entry
            System.out.println("Private key entry password:  ");

            String privateKeyEntryPassword = (new BufferedReader(
                    new InputStreamReader(System.in))).readLine();
            keyStore.setEntry(entryAlias,
                    new KeyStore.PrivateKeyEntry(privateKey, chain),
                    new KeyStore.PasswordProtection(privateKeyEntryPassword.toCharArray())
            );

// Write out the keystore
            FileOutputStream keyStoreOutputStream =
                    new FileOutputStream(keyStoreFileName);
            keyStore.store(keyStoreOutputStream, keyStorePassword.toCharArray());
            keyStoreOutputStream.close();
        }

        catch (Exception e) {
            e.printStackTrace();
            System.exit(1);
        }
    }
}