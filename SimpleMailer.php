<?php
// SimpleMailer.php - Lightweight SMTP Client for Plena Aplicativos
// Compatible with PHP 7.4+

class SimpleMailer {
    private $host;
    private $port;
    private $username;
    private $password;
    private $timeout = 30;
    private $debug = false;
    private $socket;
    private $logs = [];

    public function __construct($host, $port, $username, $password) {
        $this->host = $host;
        $this->port = $port;
        $this->username = $username;
        $this->password = $password;
    }

    public function setDebug($bool) {
        $this->debug = $bool;
    }

    private function log($msg) {
        $this->logs[] = $msg;
        if ($this->debug) {
            error_log("[SMTP] " . $msg);
        }
    }

    public function getLogs() {
        return $this->logs;
    }

    private function sendCmd($cmd, $expect = [250]) {
        if ($cmd) {
            fputs($this->socket, $cmd . "\r\n");
            $this->log("CLIENT: $cmd");
        }
        
        $response = "";
        $code = "";
        
        while (true) {
            $line = fgets($this->socket, 515);
            if ($line === false) {
                $this->log("ERROR: No response from server (fgets failed). Info: " . json_encode(stream_get_meta_data($this->socket)));
                return false;
            }
            
            $response .= $line;
            $this->log("SERVER RAW: " . trim($line));
            
            // Check for potential multi-line response end
            // Format: "XYZ <message>" (Space at 4th char)
            // Multi-line: "XYZ-<message>" (Hyphen at 4th char)
            if (strlen($line) >= 4 && substr($line, 3, 1) == ' ') {
                $code = (int)substr($line, 0, 3);
                break;
            }
        }
        
        if (!in_array($code, $expect)) {
            $this->log("ERROR: Expected " . implode('/', $expect) . ", got $code. Full: $response");
            return false;
        }
        return true;
    }

    public function send($to, $subject, $htmlBody, $fromEmail, $fromName) {
        $this->logs = [];
        $protocol = ($this->port == 465) ? 'ssl://' : 'tcp://';
        $serverAddr = $protocol . $this->host . ':' . $this->port;

        $this->log("Connecting to $serverAddr...");
        
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);

        $this->socket = @stream_socket_client($serverAddr, $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);
        
        if (!$this->socket) {
            $this->log("CONNECTION FAILED: $errno - $errstr");
            return false;
        }

        stream_set_blocking($this->socket, true);
        stream_set_timeout($this->socket, $this->timeout);
        $this->log("Connected to $serverAddr. Waiting for banner...");

        // Handshake
        if (!$this->sendCmd(null, [220])) return false;
        
        // EHLO
        if (!$this->sendCmd("EHLO " . gethostname(), [250])) {
            if (!$this->sendCmd("HELO " . gethostname(), [250])) return false;
        }

        // STARTTLS if port 587
        if ($this->port == 587) {
            if (!$this->sendCmd("STARTTLS", [220])) return false;
            stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if (!$this->sendCmd("EHLO " . gethostname(), [250])) return false;
        }

        // AUTH LOGIN
        if (!$this->sendCmd("AUTH LOGIN", [334])) return false;
        if (!$this->sendCmd(base64_encode($this->username), [334])) return false;
        if (!$this->sendCmd(base64_encode($this->password), [235])) return false;

        // MAIL FROM
        if (!$this->sendCmd("MAIL FROM: <$fromEmail>", [250])) return false;

        // RCPT TO
        if (!$this->sendCmd("RCPT TO: <$to>", [250, 251])) return false;

        // DATA
        if (!$this->sendCmd("DATA", [354])) return false;

        // Headers & Body
        $headers  = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "Date: " . date("r") . "\r\n";
        $headers .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <$fromEmail>\r\n";
        $headers .= "To: <$to>\r\n";
        $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
        $headers .= "X-Mailer: PlenaSimpleMailer/1.0\r\n";

        fputs($this->socket, $headers . "\r\n" . $htmlBody . "\r\n.\r\n");
        
        if (!$this->sendCmd(null, [250])) return false;

        // QUIT
        $this->sendCmd("QUIT", [221]);
        fclose($this->socket);
        
        $this->log("Email sent successfully to $to");
        return true;
    }
}
