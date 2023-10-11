
<?php

function encode_password($plain, $challenge, $secret) {
	if ((strlen($challenge) % 2) != 0 ||
	    strlen($challenge) == 0)
	    return FALSE;
	$hexchall = hex2bin($challenge);
	if ($hexchall === FALSE)
		return FALSE;
	if (strlen($secret) > 0) {
		$crypt_secret = md5($hexchall . $secret, TRUE);
		$len_secret = 16;
	} else {
		$crypt_secret = $hexchall;
		$len_secret = strlen($hexchall);
	}
	/* simulate C style \0 terminated string */
	$plain .= "\x00";
	$crypted = '';
	for ($i = 0; $i < strlen($plain); $i++)
		$crypted .= $plain[$i] ^ $crypt_secret[$i % $len_secret];
	$extra_bytes = 0;//rand(0, 16);
	for ($i = 0; $i < $extra_bytes; $i++)
		$crypted .= chr(rand(0, 255));
		
	return bin2hex($crypted);
}

function decode_password($dict, $encoded, $secret){
	if (!array_key_exists('RA', $dict))
		return FALSE;
	if (strlen($dict['RA']) != 32)
		return FALSE;
	$ra = hex2bin($dict['RA']);
	if ($ra === FALSE)
		return FALSE;
	if ((strlen($encoded) % 32) != 0)
		return FALSE;
	$bincoded = hex2bin($encoded);
	$password = "";
	$last_result = $ra;
	for ($i = 0; $i < strlen($bincoded); $i += 16) {
		$key = hash('md5', $secret . $last_result, TRUE);
		for ($j = 0; $j < 16; $j++)
			$password .= $key[$j] ^ $bincoded[$i + $j];
		$last_result = substr($bincoded, $i, 16);
	}
	$j = 0;
	for ($i = strlen($password); $i > 0; $i--) {
		if ($password[$i - 1] != "\x00")
			break;
		else
			$j++;
	}
	if ($j > 0) {
		$password = substr($password, 0, strlen($password) - $j);
	}
 
	return $password;
}

function validate_login($username, $password, $mac, $secret, $sigsecret) {
	$response = array();

	$response['CODE'] = "ACCEPT";
	$response['SECONDS'] = 3600;
	$response['DOWNLOAD'] = 4294967295;
	$response['UPLOAD'] = 4294967295;

	$result = "";
	foreach ($response as $key => $value) {
		$result .= '"' . rawurlencode($key) . '" "' . rawurlencode($value) . "\"\n";
	}

	return $result;
}

function calculate_new_ra($ra, $secret) {	
	if (strlen($ra) != 32) return;

	$ra = hex2bin($ra);
	if ($ra === FALSE) return;
	
	$ra = hash('md5', "ACCEPT" . $ra . $secret);

	return $ra;
}
