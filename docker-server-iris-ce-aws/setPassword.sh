#!/bin/bash
#changes the password for iris 

# Modified by Rob Tweed, M/Gateway Developments
# for Derived IRIS Community Edition container for QEWD

main(){
    message
}

message(){
    printf "\nYou are about to change the password for the IRIS instance."
    printf "\nThe default credentials are the following."
    printf "\n"
    printf "\nUsername: _SYSTEM"
    printf "\nPassword: SYS"
    printf "\n"
    printf "\nThese credentials are expired and you will be prompted to change them"
    printf "\nif you try to log in manually."
    printf "\n"
    printf "\nThis utility will change the default password for all default accounts"
    printf "\nand can only be run once. After that you will be responsible for the "
    printf "\nsecurity of the IRIS instance."
    printf "\n"
    printf "\nThe default system users with all permissions are _SYSTEM and SuperUser"
    printf "\nOther predefined users are Admin and CSPSystem"
    printf "\nLearn more here"
    printf "\nhttps://docs.intersystems.com/irislatest/csp/docbook/DocBook.UI.Page.cls?KEY=GCAS_users#GCAS_users_predefined"
    printf "\n"
    read -r -p "Change the password? [Y/N] " response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]] 
    then
        change
    else
        printf "\n Not changing password.\n"
    fi
}

change(){
    flag=0
    # check if passwords match and if not ask again
    while [ "$flag" = "0" ];
    do
        # read password twice
        printf "\n\n"
        read -s -p "New Password: " password
        printf "\n"
        read -s -p "Confirm Password: " password2
        printf "\n"
        if [ "$password" = "SYS" ]
        then
            printf "Password cannot be SYS"
        elif [ "$password" = "" ]
        then
            printf "Password cannot be empty"
        elif [ "$password" != "$password2" ]
        then
            printf "Passwords do not match try again"
        else
            flag=1
        fi
    done
    
    #spinner
    spinner run $password
    update_MOTD
    exit
}

update_MOTD(){
    #eventually will actually update the message of the day.
    printf "\nPassword successfully reset."
    printf "\n"
    printf "\nLearn more with a QuickStart: "
    printf "\n  https://learning.intersystems.com/course/view.php?id=1055"
    #printf "\nLoad sample data: "
    #printf "\n  \$iris load"
    printf "\nEnter the IRIS container at a bash shell:"
    printf "\n  \$sudo docker exec -it try-iris bash"
    printf "\n "
    printf "\nFor more options type:"
    printf "\n  \$iris help"
    printf "\n "
}

run(){
    sudo docker exec qewd_iris bash -c 'echo '"$1"' >/tmp/pwd.txt' > /dev/null 2>&1
    sudo docker exec qewd_iris bash -c "/usr/irissys/dev/Cloud/ICM/changePassword.sh /tmp/pwd.txt" > /dev/null 2>&1
    sudo docker exec qewd_iris bash -c "iris start iris" > /dev/null 2>&1
    
}

spinner(){
    ("$@") &
    show_spinner "$!"
}

show_spinner()
{
    local -r pid="${1}"
    local -r delay='0.75'
    local spinstr='\|/-'
    local temp
    while ps a | awk '{print $1}' | grep -q "${pid}"; do
        temp="${spinstr#?}"
        printf " [%c]  " "${spinstr}"
        spinstr=${temp}${spinstr%"${temp}"}
        sleep "${delay}"
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}
main