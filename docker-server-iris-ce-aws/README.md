# QEWD-IRIS: Docker Container derived from the InterSystems IRIS Community Edition for AWS
 
Rob Tweed <rtweed@mgateway.com>  
24 January 2019, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)  

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community)

# QEWD-IRIS

The instructions below explain how you can run QEWD with the InterSystems IRIS Community Edition for AWS.

It involves building a new Docker Container, derived from the one that is supplied with the AWS Community Edition EC2 instance.  I've automated as much as I can, but any suggestions / further customisations to improve it and further automate it are welcomed.


# Provisioning the EC2 Server

On AWS, select and provision a InterSystems IRIS Community Edition EC2 instance.  

During the provisioning steps, configure it manually to customise the Security Group.  Specifically, add a new Rule as follows:

- Custom TCP
- Protocol: TCP
- Port Range: 8080-8084
- Source: Custom 0.0.0.0/0

These ports will be used by QEWD's Web Server


# Preparing the EC2 Image

Once the EC2 instance is up and running, SSH into it and do the following:

## Stop the Community Edition Docker Container

        sudo docker stop try-iris

## Install Subversion

Subversion provides a quick and easy way of downloading just the individual sections of the QEWD Github repository that we need.


        sudo apt-get install -y subversion

## Download the DockerFile & Startup for QEWD

        cd ~
        svn export https://github.com/robtweed/qewd/trunk/docker-server-iris-ce-aws

You should now see a directory named *~/docker-server-iris-ce-aws*


# Building the New QEWD-IRIS Docker Image

        cd ~/docker-server-iris-ce-aws
        sudo docker build -t qewd-iris .

**Note**: make sure you include that period/full-stop at the end of the *build* line above!

You now have a Docker Image named *qewd-iris* and we're ready to get going.


# Run a QEWD-Up Application

We'll just use a simple demo application that I've created for you to test:

        cd ~
        svn export https://github.com/robtweed/qewd/trunk/up/examples/iris-ce-aws/simple qewd-example

You'll now see a directory named *~/qewd-example* that contains a very simple QEWD-Up Application definition

Start up the QEWD-IRIS container using this QEWD-Up application folder:

        sudo docker run --name qewd-iris -it --rm -p 8080:8080 -p 51773:51773 -p 52773:52773 -v ~/qewd-example:/opt/qewd/mapped --entrypoint /opt/qewd/start_qewd.sh  qewd-iris


Note: we're exposing port 8080 for the QEWD Web Server, and 51773 and 52773 for IRIS management purposes

## **NOTE**: IRIS Password

Note the file within the *~/qewd-example* directory named *password.txt*.  

This file is used when the QEWD-IRIS container starts up to define the System password, which, in turn, is used by the *iris.node* Node.js interface module.

Currently *password.txt* contains the password *secret123*, which is also the password expected in the *~/qewd-example/configuration/config.json* file.  

If you change the password in the *password.txt* file, make sure you similarly change the password in your QEWD-Up application's */configuration/config.json* file.


# Try the QEWD-Up Application's REST APIs

Everthing should now be ready, so you can try out the simple demo QEWD-Up Application.  

If you look in the file *~/qewd-example/configuration/routes.json* you'll see that it just defines a single REST API:


        [
          {
            "uri": "/api/info",
            "method": "GET",
            "handler": "getInfo" 
          }
        ]

Let's try it from your browser:

        http://x.x.x.x:8080/api/info

and you should get back a JSON response that looks something like this:

        {
            "info": {
                "server": "QEWD-Up Monolith",
                "arch": "x64",
                "platform": "linux",
                "versions": {
                    "http_parser": "2.8.0",
                    "node": "8.15.0",
                    "v8": "6.2.414.75",
                    "uv": "1.23.2",
                    "zlib": "1.2.11",
                    "ares": "1.10.1-DEV",
                    "modules": "57",
                    "nghttp2": "1.33.0",
                    "napi": "3",
                    "openssl": "1.0.2q",
                    "icu": "60.1",
                    "unicode": "10.0",
                    "cldr": "32.0",
                    "tz": "2017c"
                },
                "memory": {
                    "rss": 46526464,
                    "heapTotal": 18169856,
                    "heapUsed": 9761680,
                    "external": 177752
                }
            }
        }


#Try the QEWD-Monitor Application

Start the QEWD-Monitor application in your browser using the URL:

        http://x.x.x.x:8080/qewd-monitor

You'll need to enter the QEWD Management password which, by default, is *keepThisSecret!*.

You'll now see the Overview panel, from where you can monitor your QEWD run-time environment, view the master and worker process activity.

Click the tabs in the banner to view your IRIS USER namespace Global Storage and inspect any QEWD Sessions.


# Further Information on Developing using QEWD-Up

You now have a fully-working IRIS-based QEWD-Up environment, and you can begin to try building your own applications.

For further information about QEWD-Up:

- [Information and background to QEWD-Up](https://github.com/robtweed/qewd/tree/master/up)
- [Detailed QEWD-Up Documentation](https://github.com/robtweed/qewd/tree/master/up/docs)



# QEWD-IRIS Container Run-Time Modes

## Interactive Mode

Using the *docker run* command above, the QEWD-IRIS Container will have started in *interactive* mode and you should see the *bash shell* prompt - something like this:

        root@4e067a779d54:/opt/qewd#

In this mode you can manually start, stop and restart QEWD without having to restart the Container, which is ideal for QEWD-Up application development.

### Start QEWD

        npm start

### Stop QEWD

       CTRL&C

or use the QEWD-Monitor application.

You'll return to the *bash shell* prompt.

### Exit/shut down the Container

        exit

## Daemon Mode

If you start the Container as a daemon process, you should set the Environment Variable *QEWD_RUN_MODE* to *daemon" in your *docker run* command, eg:

        sudo docker run --name qewd_iris -d --rm -p 8080:8080 -p 51773:51773 -p 52773:52773 -v ~/qewd-example:/opt/qewd/mapped --entrypoint /opt/qewd/start_qewd.sh -e QEWD_RUN_MODE="daemon" qewd-iris

In this mode, QEWD is started automatically and you can run your QEWD Applications as soon as it has completed its startup processes.

Daemon Mode should be used once you've completed development.


