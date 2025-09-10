## Setting Up your Development Environment

If you plan to modify the source code and build your own version of the plugin, follow the steps in this section to set up the development environment.

Before you begin, if you modify the source code and rebuild the plugin, it is no longer signed. The signature is based on a hash of the distribution, so you will have to run it as unsigned. 

For the plugin to load, add the following configuration parameter to the  `/etc/grafana/grafana.ini` file in the [plugins] section:

`allow_loading_unsigned_plugins = vertica-grafana-datasource`

![Allow Unsigned Plugin](https://raw.githubusercontent.com/vertica/vertica-grafana-datasource/main/src/img/allow-unsigned-plugin.png)

### Prerequisites 
* [Grafana](https://grafana.com/docs/grafana/latest/installation/) (version 10.x)
* [Vertica](https://www.vertica.com/download/vertica/) 
* [NodeJS](https://nodejs.org/en/download/package-manager/) (version 18 or higher) (Package Manager: [yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable)) 
* [Go](https://golang.org/doc/install) 
* [Mage](https://magefile.org/)

**Note:** This plugin is tested in **Linux(Ubuntu)** with the following  versions:

* Grafana - v10.1.2
* NodeJS - v18.18.0
* Yarn - v1.22.19
* Npm - v9.8.1
* Go - v1.21.9
 
### Installing Vertica Grafana Data Source Plugin 
**Note:** If you have the older version of the Vertica Grafana plugin, remove it using grafana-cli:
     
      grafana-cli plugins remove vertica-grafana-datasource
      
      
1. Clone the new Vertica Grafana data source repository into the plugins directory. 
2. Go to the Vertica plugin folder. 
3. To build the plugin 
   1. Install dependencies: 
   
       ```bash 
          yarn install 
       ``` 
   2. Build plugin in production mode: 
   
       ```bash 
          yarn build 
       ``` 
   3. Build backend plugin binaries for Linux, Windows, and Darwin: 
   
       ```bash
          mage -v
       ```
4. Restart the Grafana server.

