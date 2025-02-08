pragma solidity >=0.7.0 <0.9.0;

import "PoseidonVerifier.sol";

contract PoseidonDeposit {
    Groth16Verifier public verifier;

    constructor(Groth16Verifier _verifier) {
        verifier = _verifier;
    }

    mapping(uint256 => bool) recipientMapping;
    mapping(uint256 => uint256) recipientAmount;

    function deposit(uint256 recipientHash) public payable {
        recipientMapping[recipientHash] = true; // haven't withdrawn
        recipientAmount[recipientHash] += msg.value;
    }

    function withdraw(
        address payable recipientAddress,
        uint256[8] calldata _proof,
        uint256[1] calldata _pubSignals
    ) public payable {
        require(
            recipientMapping[_pubSignals[0]],
            "You don't have access to the ETH or you have already withdrawn"
        );
        require(
            verifier.verifyProof(
                [_proof[0], _proof[1]],
                [[_proof[2], _proof[3]], [_proof[4], _proof[5]]],
                [_proof[6], _proof[7]],
                _pubSignals
            ),
            "Proof invalid"
        );

        uint256 amount = recipientAmount[_pubSignals[0]];
        require(address(this).balance >= amount, "Not enough balance");
        (bool success, ) = recipientAddress.call{value: amount}("");
        require(success, "Transfer failed");
        recipientAmount[_pubSignals[0]] -= amount;
        recipientMapping[_pubSignals[0]] = false;
    }
}
