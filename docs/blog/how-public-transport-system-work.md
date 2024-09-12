---
title : "¿Como funcionan los sistemas del transporte publico?"
date : "24/01/2024"
description : "Entendiendo los servicios informaticos del transporte publico y sus fracasos"
---

# ¿Como funcionan los sistemas del transporte publico?

![Interurbanos](/How-public-transport-systems-work/interurbanos.jpg)

He usado el transporte publico desde que tenia consciencia, y a decir verdad, me ha ayudado mucho.
Pero siempre que espero al bus tengo una duda: **¿Cuanto le queda?**

A decir verdad, esta duda fue resuelta hace tiempo por el CRTM (Consorcio Regional de Transportes de Madrid) al crear un servicio que te proporciona los datos de los buses urbanos e interurbanos.

*¿Pero y si eres de Madrid cAPItal?*

Bueno entonces tienes la aplicación de EMT para ver los tiempos.

*¿Y si prefiero usar el metro?*

Para eso esta la aplicación de Metro Madrid.

*¿Y si tengo que usar el tren?*

Te descargas la aplicación de Adif.

*¿Y si tengo que ver el saldo de mi abono transporte?*

Pues la aplicación de Tarjeta Transporte te permite consultarlo.

Creo que ya lo vais pillando, te tienes que descargar 5 aplicaciónes diferentes para el transporte publico (solo en la comunidad de Madrid).

## Aplicaciones

Obviamente existen aplicaciónes que unen todos esos servicios en una sola aplicación, pero  **¿Como funcionan?**

Pues simplemente haciendo lo que hacen las aplicaciónes oficiales.

## Metodologia
Para poder ver como funcionan estas aplicaciónes usare Burp proxy y un movil android con root para poder instalar el certificado de Burp y descifrar el trafico de red.

## CRTM

El consorcio ofrece un SOAP para obtener los datos en tiempo real sobre los autobuses interurbanos y urbanos.

### ¿Cuando se hizo el servicio?

El servicio se hizo en torno al 2016, que es cuando salio una aplicación llamada *Transporte de Madrid CRTM* que ofrecia los tiempos de los autobuses en tiempo real, las paradas cercanas, las oficinas de recarga...

El principal problema es que la aplicación se veia asi: 

![Transporte de Madrid CRTM](/How-public-transport-systems-work/app-1.webp)
![Transporte de Madrid CRTM](/How-public-transport-systems-work/app-2.webp)

Bastante feo para haberlo hecho en 2016 por la empresa que gestiona el transporte publico de Madrid, ¿no?

Bueno, pues la aplicación se acabo borrando de la app store y de la play store.
Pero aunque quitasen la aplicación, el servicio seguia funcionando.

### ¿Como funciona el servicio?

Si interceptamos las peticiones de la aplicación que una vez fue *Transporte de Madrid CRTM*, podemos ver esto:

![Transporte de Madrid CRTM](/How-public-transport-systems-work/crtm.png)

y si entramos a la url http://www.citram.es:8080/WSMultimodalInformation/MultimodalInformation.svc pues encontramos el servicio SOAP y con el podemos generar un cliente, pero aun falta la clave privada, que podemos obtener si decompilamos el apk.

![Transporte de Madrid CRTM](/How-public-transport-systems-work/crtm2.png)

## EMT

La empresa municipal de transportes parece hacerlo algo mejor ya que su API es publica, esta documentada y se actualiza, asi que realmente no hace falta interceptar el trafico.

Cualquier persona puede consultarla y consumirla: https://apidocs.emtmadrid.es/

## Metro

Metro es bastante curioso ya que tiene una aplicación decente pero no hay API publica 😞.

Pero si que la hay privada.

### ¿Como funciona la API de metro?

Bueno pues la API de metro tampoco tiene mucha cosa, pero si que hay dos endpoints importantes:

- Consultar datos de un abono transporte: `POST` https://serviciosapp.metromadrid.es/tarjetapost/login con body `sNumeroTP=...&version=2`
- Consultar tiempos de las estaciones: `GET`  https://serviciosapp.metromadrid.es/servicios/rest/teleindicadores

## Tren

En este caso tampoco hay una API publica pero al igual que metro, si que la hay privada.

Usando Burp, puedes obtener la "documentacion".

![Adif](/How-public-transport-systems-work/adif.png)


La app que provee los datos en este caso es ADIF.

Por desgracia usan una autorizacion con encriptado HMAC-SHA256, lo que significa que hacer una llamada no es tan simple como poner un token que no cambia, o llamar a una API que nos lo provea.

Aqui cada llamada tendra un valor u otro segun los headers y esta encriptado con una clave secreta que se puede obtener si decompilamos el apk:

![Adif html](/How-public-transport-systems-work/adif3.png)

pero por alguna razon parece que no quieren que nadie lo use:

```kotlin
private fun getSignatureKey(str: String, str2: String, str3: String): ByteArray {
    return hmacSha256(hmacSha256(hmacSha256(str.toByteArray(StandardCharsets.UTF_8), str2), str3), ELCANO_REQUEST)
}
```

¿Realmente es necesario encriptar lo encriptado de lo encriptado ADIF? 🤔 

## Tarjeta transporte publico

Para obtener los datos de la tarjeta de transporte publico podemos usar el endpoint de metro, pero eso solo valdria para tarjetas personales, asi que vamos a ver como funciona la aplicación de Tarjeta Transporte.

De primeras se llama a el endpoint para iniciar la conexion, y se le tiene que pasar una serie de datos:

![Abono](/How-public-transport-systems-work/abono.png)

A partir de esta respuesta obtenemos una cookie que sera nuestro identificador de sesion.

El siguiente paso es empezar el proceso de lectura pasando el punto de venta.

```json
{
    "titleList": "COMMON",
    "salePoint": "010201000005",
    "updateCard": true,
    "commandType": "WRAPPED",
    "opInspection": false
}
```

y esto nos devuelve una serie de comando que debemos pasar a la tarjeta por NFC. 

```json
{
    "status": {
        "code": "0010",
        "description": []
    },
    "capdu": [
        "9060000000",
        "90AF000000",
        "90AF000000",
        "905A00000300000100",
        "900A0000010200"
    ],
    "balance": null,
    "titleList": null,
    "updateReason": null,
    "uniqueIdTransactionMS": null,
    "uniqueIdTransactionLS": null
}
```

una vez pasados, se debe devolver al servidor las respuestas de la tarjeta:

```json
{
    "titleList": "COMMON",
    "rapdu": [
        "0401010100180591AF",
        "0401010104180591AF",
        "0454211ADA3B80BA5494BA5024149100",
        "9100",
        "4FB07C8DC2A8946791AF"
    ],
    "salePoint": "010201000005",
    "updateCard": true,
    "commandType": "WRAPPED",
    "opInspection": false
}
```

y asi hasta que el servidor nos de el codigo `0000`

que contendra el saldo y los posibles titulos recargables con sus precios:

```json
{
    "status": {
        "code": "0000",
        "description": []
    },
    "capdu": null,
    "balance": {
        "desfireSerial": "...",
        "now": "2024-01-24 01:01:30",
        "controlDigit": "00",
        "orderCode": "C",
        "cardOrderNumber": "...",
        "initAppDate": "2015-11-24",
        "finishAppDate": "2025-11-24",
        "blockedApp": false,
        "groupName": "Normal",
        "groupShortName": "Normal",
        "groupId": 0,
        "initGroupDate": "2015-11-24",
        "finishGroupDate": "2025-11-24",
        "profiles": [
            {
                "profileId": 1,
                "profileName": "Normal",
                "initProfileDate": "2015-11-24",
                "finishProfileDate": "2025-11-24"
            },
            {
                "profileId": 3,
                "profileName": "Joven",
                "initProfileDate": "2015-11-24",
                "finishProfileDate": "2025-11-24"
            }
        ]
        ...
    }
}
```

## ¿Y ahora?

Bueno pues ahora podemos obtener los tiempos de los transportes y las ubicaciones en el caso de los autobuses.
Aunque aun falta lo mas importante, **Las paradas**.

¿Pero de donde sacas la informacion de **todas** las paradas?

Pues del servicio multimodal https://datos-movilidad.crtm.es/.

> Aqui la noticia de 2018 (que ha sido borrada de la pagina principal)
> [Plataforma multimodal abierta para agosto de 2019](http://web.archive.org/web/20211127182849/https://www.madrid.es/portales/munimadrid/es/Inicio/Medio-ambiente/CIVITAS-ECCENTRIC/Las-11-medidas/Plataforma-abierta-multimodal-con-informacion-y-servicios-de-movilidad-medida-3-3-/?vgnextfmt=default&vgnextoid=a0aab0cb9959f510VgnVCM2000001f4a900aRCRD&vgnextchannel=a92192f14e69f510VgnVCM1000001d4a900aRCRD#)

¿Y que puedes sacar de este servicio?:

- Datos de las paradas, itinerarios, etc. 
- Datos GTFS.
- Una pagina que no funciona para ver cuanto le queda al bus en tiempo real.

## Conclusión
Con esto ya tenemos toda la informacion necesaria para hacer una aplicación que:

- Muestre las paradas.
- Te diga la caducidad del abono.
- Te muestre los tiempos de espera.
- Te muestre las localizaciones de los autobuses.
- Te notifique el tiempo restante cada minuto.
- Te avise sobre las posible incidencias que afectan a una parada, linea...

Asi que aqui esta: [https://www.madridtransporte.com/](https://www.madridtransporte.com/)

Puedes ver el codigo fuente aqui: [https://github.com/xBaank/MadridTransporte](https://github.com/xBaank/MadridTransporte)


### Version Play Store de acceso cerrado.

Si quieres descargarlo desde Play Store necesitas unirte a este grupo de google: https://groups.google.com/g/testing-madrid-transporte

Descargar la app: https://play.google.com/store/apps/details?id=com.madridtransporte
