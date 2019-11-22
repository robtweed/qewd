# QEWD-IRIS: Running QEWD on the InterSystems IRIS Community Edition for AWS
 
Rob Tweed <rtweed@mgateway.com>  
22 November 2019, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)  

Twitter: @rtweed

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community)

# QEWD-IRIS

The instructions below explain how you can run QEWD with the InterSystems IRIS Community Edition for AWS.

The instructions should be easily applied to other cloud versions of IRIS (eg Azure, Google)

# Provisioning the EC2 Server

On AWS, select and provision a InterSystems IRIS Community Edition EC2 instance. 

For testing purposes and to try QEWD out, a *t2.micro* EC2 instance will be sufficient.

During the provisioning steps, configure it manually to customise the Security Group.  
Specifically, add a new Rule as follows:

- Custom TCP
- Protocol: TCP
- Port Range: 8080-8084
- Source: Custom 0.0.0.0/0

These ports will be used by QEWD's Web Server


# Preparing the EC2 Image

Once the EC2 instance is up and running, SSH into it as the user *ubuntu*.

Install *subversion*:

        sudo apt-get update
        sudo apt-get install -y subversion


The IRIS container maps its internal directory */ISC* to the host 
EC2 Image's */opt/ISC* directory.  So any changes we make to files and subdirectories
on the host's */opt/ISC* directory are immediately reflected within the container.

However, before we can make any changes, you'll need to change the permissions to the
directory:

        sudo chown ubuntu:ubuntu /opt/ISC

Now download the QEWD installation resources

        cd /opt/ISC
        svn export https://github.com/robtweed/qewd/trunk/docker-server-iris-ce-aws /opt/ISC/qewd-install



# Run the QEWD Installer / Configurator Script


        cd /opt/ISC/qewd-install
        source enable_qewd.sh


## Restart the Community Edition Docker Container

        sudo docker-compose stop
        sudo docker-compose up


You'll find that the IRIS container is now named qewd-iris

You can now build and run QEWD Applications



# Create a QEWD-Up Application

We'll just use a simple demo application that I've created for you to test:

        cd ~
        svn export https://github.com/robtweed/qewd/trunk/up/examples/iris-ce-aws/simple /opt/ISC/qewd-example

You'll now see a directory named */opt/ISC/qewd-example* that contains a very simple 
QEWD-Up Application definition


# Install the QEWD Application

This step only needs doing once.  It installs all the Node.js modules used by QEWD.

Shell into the IRIS container:


        sudo docker exec -it qewd-iris bash


Once you're into the container's shell, type:

        cd /ISC/qewd-example
        npm install


You're now ready to start the QEWD Application



# Start the QEWD Application

Each time you want to start the QEWD application, first make sure you're in the IRIS container's
shell and in the */ISC/qewd-example* directory.

        cd /ISC/qewd-example


Then, start the QEWD Application by typing:

        npm start


QEWD is ready for use when you see this:

        ========================================================
        ewd-qoper8 is up and running.  Max worker pool size: 2
        ========================================================
        ========================================================
        QEWD.js is listening on port 8080
        ========================================================



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


# Try the QEWD-Monitor Application

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



# QEWD Application Run-Time Modes

## Interactive Mode

Using the *npm start* command above, the QEWD process will have started in *interactive* mode 
and you will see its log output appearing in your terminal window.

In this mode you can manually start, stop and restart QEWD without having to restart the Container, 
which is ideal for QEWD-Up application development.

### Start QEWD

        npm start

### Stop QEWD

       CTRL&C

or use the QEWD-Monitor application.

You'll return to the *bash shell* prompt.


### Exit/shut down the Container

        exit


## Background Mode

You can detach the QEWD process and run it as a background job by starting it as follows:

        nohup npm start

In this mode, you can safely exit the Container's shell and the QEWD process will continue to
run.  However:

- I've not been able to discover a way to monitor its output log
- To shut down the QEWD Process, you'll need to use the QEWD Monitor application


