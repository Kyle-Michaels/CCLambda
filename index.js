const aws = require('aws-sdk');
const sharp = require('sharp');

exports.handler = async (event) => {
  // Read data from event object.
  const record = event.Records[0];
  const region = record.awsRegion
  const sourceBucket = record.s3.bucket.name
  const sourceKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  // Check if key is valid.
  if (!sourceKey) {
    console.error(`${sourceKey} is undefined`);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: `${sourceKey} is undefined` }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  // Check if image has already been resized
  if (sourceKey.includes('resized-images')) {
    return {
      statusCode: 204,
      body: JSON.stringify({ message: 'Image has already been resized.' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  // Instantiate a new S3 client
  const s3Client = new aws.S3({
    region: region
  })

  try {
    // Get Object
    const image = await s3Client.getObject({ Bucket: sourceBucket, Key: sourceKey }).promise()
    const metadata = await sharp(image.Body).metadata();

    // Resize Image
    const resizedImage = await sharp(image.Body).resize({ width: 150 }).toBuffer();

    // Upload resized image
    await s3Client.putObject({
      Bucket: sourceBucket,
      Key: sourceKey.replace('original-images', 'resized-images'),
      Body: resizedImage
    }).promise()

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Resized Image successfully' }),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  }
  catch (err) {
    console.error('Error: ', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error.' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};