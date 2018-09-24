const GringottsBank = artifacts.require("./GringottsBank.sol");
const SettingsRegistry = artifacts.require("./SettingsRegistry.sol");
const StandardERC223 = artifacts.require("./StandardERC223.sol");
const DeployAndTest = artifacts.require("./DeployAndTest.sol");

module.exports = function(deployer, network, accounts) {
    if (network == "developement")
    {
        deployOnLocal(deployer, network, accounts);
    } else {
        deployOnLocal(deployer, network, accounts);
    }
};

function deployOnLocal(deployer, network, accounts) {
    console.log(network);
    
    deployer.deploy([
        SettingsRegistry,
        DeployAndTest
    ]).then(async () => {
        let instance = await DeployAndTest.deployed();

        let ring  =  await instance.testRING.call();
        let kton  =  await instance.testKTON.call();
        console.log("Loging: ring..." + ring);
        return deployer.deploy(GringottsBank, ring, kton, SettingsRegistry.address);
    }).then(async () => {
        console.log("Loging: change owner");
        console.log("Loging: bank..." + GringottsBank.address);
        let deployAndTest = await DeployAndTest.deployed();

        let ring  =  await deployAndTest.testRING.call();
        let kton  =  await deployAndTest.testKTON.call();

        let bank = await GringottsBank.deployed();

        let registry = await SettingsRegistry.deployed();

        // default settings
        // interest is about 1.015 KTON
        let bank_unit_interest = await bank.UINT_BANK_UNIT_INTEREST.call();
        await registry.setUintProperty(bank_unit_interest, 1015 * 10**15);

        let bank_penalty_multiplier = await bank.UINT_BANK_PENALTY_MULTIPLIER.call();
        await registry.setUintProperty(bank_penalty_multiplier, 3);

        await StandardERC223.at(kton).setOwner(GringottsBank.address);

        let interest = await bank.computeInterest.call(10000, 12, 1015 * 10**15);
        console.log("Current interest is: ... " + interest);
    }).then(async () => {
        let instance = await DeployAndTest.deployed();

        let ring  =  await instance.testRING.call();
        let kton  =  await instance.testKTON.call();
        let kton_owner = await StandardERC223.at(kton).owner.call();
        console.log(kton_owner);

        console.log("Loging: bank..." + GringottsBank.address);

        await StandardERC223.at(ring).mint(accounts[0], 10000 * 10**18);

        // Need to run `web3.eth.defaultAccount = web3.eth.accounts[0]` before `migrate`
        // give enough of gas for executing tx
        await StandardERC223.at(ring).contract.transfer['address,uint256,bytes'](GringottsBank.address, 100 * 10**18, '0x0c', {gas: 300000});

        // query amount of kton in console.
        // DeployAndTest.deployed().then(function(instance){return instance.testKTON.call();}).then(function(addr){return StandardERC223.at(addr).then(function(instance){return instance.balanceOf.call(web3.eth.accounts[0])}).then(function(x){return x.toNumber()})})
    });


    // in `truffle develop` console
    // refer https://ethereum.stackexchange.com/questions/12957/truffle-invalid-address
}
